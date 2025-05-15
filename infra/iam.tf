resource "aws_iam_role" "ecs_task_execution" {
  name = "ecsTaskExecutionRoleNew"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "ecs_task_execution_attach" {
  name       = "ecsTaskExecutionRolePolicyAttachment"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  roles      = [aws_iam_role.ecs_task_execution.name]  # Attach to the role
}


resource "aws_iam_policy" "ecs_task_execution_policy" {
 name        = "ecsTaskExecutionRoleSSMPolicy"
  description = "Policy for ECS task to access SSM parameters"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "*"
        # Resource = [
        #   "arn:aws:ssm:${var.region}:${var.account_id}:parameter/${var.project_name}/jwt_secret",
        #   "arn:aws:ssm:${var.region}:${var.account_id}:parameter/${var.project_name}/database_url"
        # ]
      }
    ]
  })
}


resource "aws_iam_policy_attachment" "ecs_task_execution_ssm_attach" {
  name       = "ecsTaskExecutionSSMPolicyAttachment"
  policy_arn = aws_iam_policy.ecs_task_execution_policy.arn
  roles      = [aws_iam_role.ecs_task_execution.name]  # Attach to the role
}