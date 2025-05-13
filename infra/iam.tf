resource "aws_iam_policy" "ecs_task_execution_role" {
    name = "${var.project_name}-ecs-task-execution-role"
    description = "IAM policy for ECS task execution role"
    policy = jsonencode({
        Version = "2012-10-17"
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
    name = "${var.project_name}-ecs-task-execution-role-attach"
    policy_arn = aws_iam_policy.ecs_task_execution_role.arn
}