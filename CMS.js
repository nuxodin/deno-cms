import pageClass from './Page.js';

class cms {
    constructor(db){
        this.db = db;
        this.db.$page.rowClass = pageClass; // bad here !
    }
    Page(id){
        return this.db.$page.row(id);
    }
    async pageFromRequest(url) {
        var page_id = await this.db.one("SELECT page_id FROM page_url WHERE url = "+this.db.quote(url));
        if (!page_id) return false;
        return this.Page(page_id);
    }
    async redirectFromRequest(url) {
        var redirect = await this.db.one("SELECT redirect FROM page_redirect WHERE request = "+this.db.quote(url));
        if (!redirect) return false;
        if (redirect.match(/[0-9]+/)) {
            let page = this.Page(redirect);
            //url = $_SERVER['SCHEME'].'://'.$_SERVER['HTTP_HOST'].Page($redirect)->url();
            return await page.url('de');
        }
        //const url = redirect;
        //res.setHeader('Location', 'http://' + req.headers['host'] + ('/' !== req.url)? ( '/' + req.url) : '');
    }
    async render(request) {

        let page = await this.pageFromRequest(request.url);
        if (!page) {
            const redirect = await this.redirectFromRequest(request.url);
            if (redirect) {
                res.statusCode = 301;
                //res.setHeader('Location', 'http://' + req.headers['host'] + ('/' !== req.url)? ( '/' + req.url) : '');
                res.setHeader('Location', redirect);
                res.end();
                return;
            }
            if (true) { // handle 404s by cms
                page = this.Page(50); // not found
                res.status(404);
            } else {
                next();
                return;
            }
        }

        let mainPage = page;
        //let requestedPage = page;

        if (!await page.access()) { // no access
            res.status(401);
            mainPage = this.Page(77);
        }
        if (!await page.isReadable()) { // offline
            res.status(401); // 500?
            mainPage = this.Page(88);
        }

        var body = await mainPage.render();
        return `<html>
            <head>
            <body>${body}`;
    }
}

export default cms;
