resource "aws_ecr_repository" "web" {
  name = var.ecr_web_repo
}

resource "aws_ecr_repository" "server" {
  name = var.ecr_server_repo
  
}