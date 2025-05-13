resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/chat-app/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret_value
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/chat-app/database_url"
  type  = "SecureString"
  value = var.database_url_value
}
