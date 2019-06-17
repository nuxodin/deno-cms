import viperHTML from 'viperHTML';

var templates = Object.create(null);

templates.text = async (page) => {
    const Text = await page.Text('main','de');
    return '<div'+(page.edit?' contenteditable cmstxt='+Text.id : '')+'>'+Text+'</div>';
};
templates.flexible = async (page) => {
    let str = '';
    let render = viperHTML.async()(chunk => str += chunk);
    await render`<div>${(await page.contents()).map(content=>{ return content.render(); })}</div>`;
    return str;
};
templates['layout.custom.6'] = async (page) => {
    let str = '';
    let render = viperHTML.async()(chunk => str += chunk);
    await render`
    <div>
        <h1>${page.title('de')}</h1>
        <p>${page.Text('main','de')}</p>
        <div>${(await page.cont('main')).render()}</div>
        text-Element:
        <div style="border:1px solid red">${(await page.cont('text','text')).render()}</div>
    </div>`;
    return str;
};

export default templates;

