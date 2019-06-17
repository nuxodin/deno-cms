import dbRow from './../qg/dbRow.mjs';
import TextPro from './../qg/TextPro.mjs';

const Page = class extends dbRow {
    constructor(table, id) {
        const P = super(table, id);
        this.edit = true;
        return P;
    }
    async render() {
        let mod = await this.$module;
        mod = mod.replace(/^cms\./,'');
        mod = mod.replace(/^cont\./,'');

        const templates = this.table.cmsTemplates;
        if (!templates[mod]) return '<div>module does not exist</div>';
        let string = await templates[mod](this);
        if (!string) string = '<div></div>';

        const data = await this.values();

        let className = 'qgCms'+(data['type']==='c'?'Cont':'Page')+' -pid'+this.eid+' -m-'+ data.module.replace('.','-');
        // $expose = cms::classesExposeCss();
        // if ($expose)
        // 	foreach ($this->classes() as $name => $egal)
        // 		if (isset($expose[$name]))
        // 			className .= ' '.$name;

        //if (this.edit) className .= ' -e';
        let $attr = ' vcms-id="'+this.eid+'" vcms-mod="'+data['module']+'"';
        // if (data['type']==='c' && data['visible']) {
        // 	$attr = ' id="'.hee(substr(this.urlSeo(L()), 1)).'"';
        // }
        // $attr .= ' vcms-id='.this.id; // future
        // $attr .= ' vcms-mod='.data['module'];
        //        let $done = null;

        string = string.replace(/^<([^>]+)class=("([^"]*)"|([^\s>]*))/, '<$1class="$3$4 '+className+'"'+$attr);

        // $ret = preg_replace('/^<([^>]+)class=("([^"]*)"|([^\s>]*))/','<$1class="$3$4 '.className.'"'.$attr, string, 1, $done);
        // if ($done) return $ret;

        string = string.replace(/^<([^\s>]+)([\s]?)/, '<$1 class="'+className+'"'+$attr+'$2');
        //$ret = preg_replace('/^<([^\s>]+)([\s]?)/','<$1 class="'.className.'"'.$attr.'$2', string, 1, $done);

        //if ($done) return $ret;
        //return '<div class="'.className.'"'.$attr.'>'.$ret.'</div>';


        return string;
    }
    async Text(name='main', lang=null/*, value=null*/) {
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
