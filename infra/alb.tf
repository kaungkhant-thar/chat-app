resource "aws_lb" "api" {
  name = "${var.project_name}-api-alb"
  internal = false
  load_balancer_type = "application"
  subnets = data.aws_subnets.default.ids
 security_groups = [data.aws_security_group.default.id]
}


resource "aws_lb_target_group" "api" {
  name = "${var.project_name}-api-tg"
    port = 4000
    protocol = "HTTP"
    vpc_id = data.aws_vpc.default.id
    target_type = "ip"
    health_check {
        path = "/health"
        interval = 30
        timeout = 5
        healthy_threshold = 2
        unhealthy_threshold = 2
    }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port = 80
  protocol = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}