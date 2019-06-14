import { serve } from "https://deno.land/std/http/server.ts";

import { Client as MysqlClient } from "https://deno.land/x/mysql/mod.ts";
import DB from "https://raw.githubusercontent.com/nuxodin/nux_db/master/db.js";



async function main() {

	const client = await new MysqlClient().connect({
		hostname: "127.0.0.1",
		username: "cms",
		db: "cms",
		password: "cms"
	});

	const db = new DB(client);
	const x = await db.$usr;
	console.log(db);

	for await (const req of serve(":90")) {

		//let req = new qgReqResp(req);

		let text = JSON.stringify(req);
		text = req.url;
		for( let header of req.headers) {
			console.log(header);
		}

		const body = new TextEncoder().encode(text);
		req.respond({ body });
	}
}

main();


/*
import { Response } from "https://deno.land/std/http/server.ts";
import { Cookie, setCookie, getCookies } from "https://deno.land/std/http/cookie.ts";

class qgReqResp {
	construct(req, resp){
		this.Request = req;
		this.Response = new Response();
	}
	get cookie(){
		return new qgCookies(this);
	}
}
class qgCookies{
	construct(req_resp){
		this.req_resp = req_resp;
	}
	get(name){
		const cookies = getCookies(this.req_resp.Request);
		return cookies[name];
	}
	set(name, value, options){
		const cookies[name] = value;
		setCookie(this.req_resp.Response, cookies);
	}
}
*/
