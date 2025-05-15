# Use the default VPC
data "aws_vpc" "default" {
  default = true
}

# Get the subnets in the default VPC
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Define ALB security group for inbound HTTP traffic on port 80
resource "aws_security_group" "alb_sg" {
  name        = "alb_sg"
  vpc_id      = data.aws_vpc.default.id
  description = "ALB Security Group"
}

# Define ECS task security group for communication with ALB and external access
resource "aws_security_group" "ecs_sg" {
  name        = "ecs_sg"
  vpc_id      = data.aws_vpc.default.id
  description = "ECS Security Group"
}

# Security group rule to allow HTTP traffic to ALB on port 80
resource "aws_security_group_rule" "allow_http_80" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  security_group_id = aws_security_group.alb_sg.id  # ALB SG
  cidr_blocks       = ["0.0.0.0/0"]  # Allow traffic from anywhere
}

# Security group rule to allow traffic from ALB to ECS tasks on port 4000
resource "aws_security_group_rule" "allow_alb_to_ecs" {
  type                      = "ingress"
  from_port                 = 4000
  to_port                   = 4000
  protocol                  = "tcp"
  security_group_id         = aws_security_group.ecs_sg.id
  source_security_group_id  = aws_security_group.alb_sg.id  # Allow only from ALB
}

# Security group rule to allow HTTP traffic to ECS tasks on port 3000
resource "aws_security_group_rule" "allow_http_3000" {
  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  security_group_id = aws_security_group.ecs_sg.id
  cidr_blocks       = ["0.0.0.0/0"]
}
