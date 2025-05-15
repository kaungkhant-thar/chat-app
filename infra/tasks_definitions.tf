resource "aws_ecs_task_definition" "web" {
  family                   = "${var.project_name}-web"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "web",
      image     = "${aws_ecr_repository.web.repository_url}:latest",
      essential = true,
      portMappings = [{ containerPort = 3000 }],
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "NEXT_PUBLIC_API_URL", value = "http://${aws_lb.api.dns_name}" },
        { name = "NEXT_PUBLIC_METERED_API_KEY", value = "2e102c9edd32726cd08155694c712ff4a6a0" }
      ]
    }
  ])
}

resource "aws_ecs_task_definition" "server" {
  family                   = "${var.project_name}-server"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "server",
      image     = "${aws_ecr_repository.server.repository_url}:latest",
      essential = true,
      portMappings = [{ containerPort = 4000 }],
      secrets = [
        { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.jwt_secret.name },
        { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.name }
      ],
      environment = [{ name = "NODE_ENV", value = "production" }]
    }
  ])
}
