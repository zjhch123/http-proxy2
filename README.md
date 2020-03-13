# 一个可用于内网穿透的TCP代理工具

## 需要准备的

一台拥有公网IP的服务器 `node 8.0+`

一台需要内网穿透的客户端 `node 8.0+`

## Usage

首先在客户端和服务端安装tcp-proxy2

```shell
npm i tcp-proxy2 -g
```

在服务端

```shell
proxy2 server
# demo: proxy2 server
```

在客户端

```shell
proxy2 client -s <服务端IP>:<希望打开的服务端端口> -p <将请求转发到的本地端口>
# demo: proxy2 client -s 139.129.132.196:8080 -p 3000  
```

之后在客户端访问`服务端IP:希望打开的服务端端口`，如: `139.129.132.196:8080`，即可发现请求已被转发至本地端口。
