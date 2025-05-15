data "aws_vpc" "default" {
  default = true
}


data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }


}


data "aws_security_group" "default" {
  name   = "default"
  vpc_id = data.aws_vpc.default.id
}

resource "aws_security_group_rule" "allow_http_3000" {
  type = "ingress"
  from_port = "3000"
  to_port = "3000"
  protocol = "tcp"
  security_group_id = data.aws_security_group.default.id
  cidr_blocks = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "allow_http_4000" {
  type = "ingress"
  from_port = "4000"
  to_port = "4000"
  protocol = "tcp"
  security_group_id = data.aws_security_group.default.id
  cidr_blocks = ["0.0.0.0/0"]
}