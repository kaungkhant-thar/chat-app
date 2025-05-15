output "alb_dns_name" {
  value = aws_lb.api.dns_name
}


output "web_ecr_url" {
  value = aws_ecr_repository.web.repository_url
  
}

output "server_ecr_url" {
  value = aws_ecr_repository.server.repository_url
}