# main.tf - Complete Terraform Configuration for Chat App
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.97.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-1" # Change to your preferred region
}

# --------------------------
# Networking Configuration
# --------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "chat-app-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = element(["ap-southeast-1a", "ap-southeast-1b"], count.index)
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index}"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "chat-app-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# --------------------------
# Security Groups
# --------------------------
resource "aws_security_group" "chat_app" {
  name        = "chat-app-sg"
  description = "Allow traffic for chat app"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "chat-app-sg"
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs-task-execution-role-chat-app"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --------------------------
# ECR Repositories
# --------------------------
resource "aws_ecr_repository" "web" {
  name                 = "chat-app-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "server" {
  name                 = "chat-app-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --------------------------
# ECS Configuration
# --------------------------
resource "aws_ecs_cluster" "chat_cluster" {
  name = "chat-app-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "chat_app" {
  family                   = "chat-app-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "web-container"
      image     = "${aws_ecr_repository.web.repository_url}:latest"
      essential = true
      portMappings = [{
        containerPort = 3000
        hostPort      = 3000
      }]
      environment = [
        {
          name  = "NEXT_PUBLIC_API_URL",
          value = "http://${aws_lb.server.dns_name}"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.chat_app.name
          "awslogs-region"        = "ap-southeast-1"
          "awslogs-stream-prefix" = "web"
        }
      }
    },
    {
      name      = "server-container"
      image     = "${aws_ecr_repository.server.repository_url}:latest"
      essential = true
      portMappings = [{
        containerPort = 4000
        hostPort      = 4000
      }],
       environment = [
         { name = "JWT_SECRET", value = var.jwt_secret_value },
        { name = "DATABASE_URL", value = var.database_url_value }
      ],
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.chat_app.name
          "awslogs-region"        = "ap"
          "awslogs-stream-prefix" = "server"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "chat_app" {
  name            = "chat-app-service"
  cluster         = aws_ecs_cluster.chat_cluster.id
  task_definition = aws_ecs_task_definition.chat_app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public.*.id
    security_groups  = [aws_security_group.chat_app.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web-container"
    container_port   = 3000
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.server.arn
    container_name   = "server-container"
    container_port   = 4000
  }
}

# --------------------------
# Load Balancer Configuration
# --------------------------
resource "aws_lb" "web" {
  name               = "chat-app-web-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.chat_app.id]
  subnets            = aws_subnet.public.*.id

  enable_deletion_protection = false
}

resource "aws_lb" "server" {
  name               = "chat-app-server-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.chat_app.id]
  subnets            = aws_subnet.public.*.id

  enable_deletion_protection = false
}

resource "aws_lb_target_group" "web" {
  name        = "chat-app-web-tg"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
    matcher             = "200"
  }
}

resource "aws_lb_target_group" "server" {
  name        = "chat-app-server-tg"
  port        = 4000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
    matcher             = "200"
  }
}

resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb_listener" "server" {
  load_balancer_arn = aws_lb.server.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.server.arn
  }
}

# --------------------------
# CloudWatch Logs
# --------------------------
resource "aws_cloudwatch_log_group" "chat_app" {
  name              = "/ecs/chat-app"
  retention_in_days = 7
}

# --------------------------
# Outputs
# --------------------------
output "web_lb_dns" {
  value = aws_lb.web.dns_name
}

output "server_lb_dns" {
  value = aws_lb.server.dns_name
}

output "ecr_web_repo_url" {
  value = aws_ecr_repository.web.repository_url
}

output "ecr_server_repo_url" {
  value = aws_ecr_repository.server.repository_url
}