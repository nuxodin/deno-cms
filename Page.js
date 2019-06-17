import Row from 'https://raw.githubusercontent.com/nuxodin/nux_db/master/Row.js';
import TextPro from './TextPro.js';

import templates from './templates.js';

const Page = class extends Row {
    constructor(db, id) {
        const P = super(db, id);
        this.edit = true;
        return P;
    }
    async render() {
        let mod = await this.$module;
        const templates = this.table.cmsTemplates;
        if (!templates[mod]) return '<div>module does not exist</div>';
        let string = await templates[mod](this);
        if (!string) string = '<div></div>';
        const data = await this.values();
        let $attr = ' vcms-id="'+this.eid+'" vcms-mod="'+data['module']+'"';
        string = string.replace(/^<([^\s>]+)([\s]?)/, '<$1 '+$attr+'$2');
        return string;
    }
    async text(name='main', lang=null/*, value=null*/) {
        if (!this._texts) this._texts = {};
        if (!this._texts[name]) {
            const rowId = await this.db.$page_text.rowId({page_id:this.eid, name});
            const row   = this.db.$page_text.row(rowId);
            await row.makeIfNot();
            let text_id = await row.$text_id;
            if (!text_id) {
                const textPro = await TextPro.generate(this.db);
                row.$text_id = text_id = textPro.id;
            }
            this._texts[name] = await TextPro(this.db, text_id);
        }
        const row = await this._texts[name].get(lang);
        return await row.$text || '';
    }
    async title(lang) {
        const id = await this.$title_id;
        const Text = await TextPro(this.db, id).get(lang);
        return await Text.$text;
    }

    async children() {
        if (!this._children) {
            this._children = [];
            const children = await this.table.rows({basis:this.eid});
            for (let child of children) {
                this._children.push(child);
                let values = await child.values();

                !this._Named && (this._Named = {});
                !this._Named[values.type] && (this._Named[values.type] = {});

                this._Named[values.type][values.name] = child;
            }
        }
        return this._children;
    }
    async contents() {
        if (!this._contents) {
            this._contents = await this.table.rows({basis:this.eid, type:'c'});
            // named
            if (!this._namedContents) this._namedContents = {};
            for (let child of this._contents) {
                const name = await child.$name;
                this._namedContents[name] = child;
            }
        }
        return this._contents;
    }
    async cont(name, attris={}) {
        await this.contents();
        if (!this._namedContents[name]) {
            if (typeof attris === 'string') attris = {module:attris};
            attris['name'] = name;
            this._namedContents[name] = await this.createCont(attris);
        }
        return this._namedContents[name];
    }
    async createCont(options) {
        options = Object.assign({
            type         : 'c',
            module       : 'flexible',
            visible      : '',
            online_start : null,
            access       : null
        },options);
        return await this.createChild(options);
    }

    /* manipulate tree */
    async createChild(options) {
        const thisdata = await this.values();
        options = Object.assign({
            basis		 : this.eid,
            online_start : Date.now() / 1000,
            access       : thisdata.access,
            module	     : thisdata.module,
            searchable   : thisdata.searchable,
            type		 : 'p',
            visible      : 1,
        }, options);
        const page = await this.table.insert(options);
        this._namedContents = this._contents = null;

        // if (!$id) return $Page; versions?

        // foreach (D()->all("SELECT * FROM page_access_usr WHERE page_id = ".this.id) as $data) {
        // 	D()->page_access_usr->insert(['page_id'=>$Page] + $data);
        // }
        // foreach (D()->all("SELECT * FROM page_access_grp WHERE page_id = ".$this->id) as $data) {
        // 	D()->page_access_grp->insert(['page_id'=>$Page] + $data);
        // }
        // if ($vs['type'] === 'p') {
        // 	if (G()->SET['cms']['pages']->has($this->id) && $this->SET->has('childXML') && $this->SET['childXML']) {
        // 		$Page->fromXML($this->SET['childXML']);
        // 	}
        // }
        // foreach ($this->Children(['type'=>$vs['type']]) as $C) {
        // 	$C->set('sort', $C->vs['sort']+1);
        // }

        // pre generate (cache) so it does not trigger a "undo step" (cms.versions) later
        // $Page->urlsSeoGen(); // needs title
        // $Page->Texts();
        // $Page->Files();
        // $Page->Classes();
        // clear runtime-cache
        //$this->Children = $this->Conts = $this->Named = null;
        return page;
    }

    async url(lang) {
        if (!this._urls) {
            let rows = await this.table.db.$page_url.rows({page_id:this.eid});
            this._urls = {};
            for (let row of rows) {
                let lang = await row.$lang;
                this._urls[lang] = row;
            }
        }
        return this._urls[lang].$url;
    }
    access(){ return true; }
    isReadable(){ return true; }
    //text(name='main', lang=null, value=null){ return 'todo'; }
};

export default Page;
