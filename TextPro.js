
class TextPro {
    constructor(db, id){
        this.db = db;
        this.id = id;
        this._texts = {};
        all[id] = this;
    }
    async get(lang){
        if (!this._texts[lang]){
            const rowId = await this.db.$text.rowId({id:this.id, lang});
            this._texts[lang] = this.db.$text.row(rowId);
        }
        return this._texts[lang];
    }
    async translated(lang){
        const Text = await this.get(lang);
        const value = await Text.$text;
        if (!value) {
            for (let l of ['de','en']) {
                if (l === lang) continue;
                const Text = await this.get(l);
                const value = await Text.$text;
                if (value) break;
            }
        }
        return value;
    }
}

const all = {};
function TextPro_factory(id){
    return all[id] || new TextPro(id);
}
TextPro_factory.generate = async function(db){
    const data = {lang:'en'};
    await db.$text.insert(data);
    return TextPro_factory(db, data.id);
};

export default TextPro_factory;
