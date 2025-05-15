variable "aws_region" {
  default = "ap-southeast-1"
}

variable "project_name" {
  default = "chat-app"
}

variable "ecr_web_repo" {
  default = "chat-web"
}

variable "ecr_server_repo" {
  default = "chat-server"
}

variable "jwt_secret_value" {
  type        = string
  sensitive   = true
}

variable "database_url_value" {
  type        = string
  sensitive   = true
}


variable "security_group_ids" {
  type        = list(string)
  description = "Security group(s) for ECS and ALB"
  default     = []
}