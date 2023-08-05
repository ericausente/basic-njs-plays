# basic-njs-plays

```
# ls -lrt
total 3880
-rw-r--r-- 1 root root  978096 Feb 10 12:00 ngx_stream_js_module.so
-rw-r--r-- 1 root root  982224 Feb 10 12:00 ngx_stream_js_module-debug.so
-rw-r--r-- 1 root root 1000136 Feb 10 12:00 ngx_http_js_module.so
-rw-r--r-- 1 root root 1004200 Feb 10 12:00 ngx_http_js_module-debug.so
```



# 1. Fetching a website resource and convert it to Text
Server can be found:  ssh -i /Users/e.ausente/ausente-f5-account-key-value-pair.pem ubuntu@18.143.74.2
Manner of accessing: https://public.kushikimi.xyz/nginxorg


/etc/nginx/conf.d/bpi.conf
```
js_path /etc/nginx/conf.d/js/;
js_import main from fetch_https.js;

server {
	server_name public.kushikimi.xyz;
	status_zone public_kushikimi_xyz_page;

        location /nginxorg {
	resolver 1.1.1.1;
	js_content main.fetch; 
  #js_fetch_trusted_certificate /etc/nginx/conf.d/rootca.crt;
	}
....
```

$ sudo cat /etc/nginx/conf.d/js/fetch_https.js 
```
async function fetch(r) {
    let reply = await ngx.fetch('http://www.kushikimi.xyz:8080/');
    let text = await reply.text();
    let footer = "----------NGINX.ORG-----------";
    
    r.headersOut['Content-Type'] = 'text/html';
    r.return(200, `${footer}\n${text.substring(0, 200)} ...${text.length - 200} left...\n${footer}`);
}
```
