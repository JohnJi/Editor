class Editor{
    
    constructor(element,options){
        this._uploadType = 1;       //文件上传的类型，枚举 10->图片 20->音频 30->视频 1->其它
        this._element = $(element); //编辑器文本域
        this._options = $.extend(true, {}, $.fn.markdown.defaults, options);
        this._isPreview = false;    //是否开启 Preview
        this._editorTimeID = "";    //编辑器的 ID
        this._loadingEl = null;
        this._loadeadEl = null;
        this._showEditor();         //初始化编辑器
        if (this._options.recentFiles.length > 0) {
            this._bindRecentFile(this._options.recentFiles);    //绑定最近上传的 5 张图片
        }
        this._bindDropEvent();      //绑定拖拽上传文件
    }

    get value(){
        return this._element.val();
    }

    _bindDropEvent(){
        $('body').on('click',()=>{
            $(`#${this._editorTimeID}>.menu-popup`).hide();
        });
        if (this._options.uploadPath !== "") {
            let drop_element = this._element.parent();
            drop_element.on('dragenter',(event)=>{
                event.preventDefault();
                drop_element.addClass(this._options.activeClass);
            }).on('dragleave',(event)=>{
                event.preventDefault();
                drop_element.removeClass(this._options.activeClass);
            }).on('drop',(event)=>{
                event.preventDefault();
                drop_element.removeClass(this._options.activeClass);
                let files=event.originalEvent.dataTransfer.files;
                if (files.length > 1) {
                    alert('不能同时上传多个文件！');
                    return false;
                } else{
                    this._uploadFile(files[0]);
                }
            });
        }
    }

    _bindRecentFile(files){
        if ($(`#recent_${this._editorTimeID}`).children().length > 0) {
            $(`#recent_${this._editorTimeID}`).children().remove();
        }
        let [_this,_fileSum] = [this,files.length>=5?5:files.length];

        for (let i = 0; i < _fileSum; i++) {
            let file = files[i];
            let _file = $('<span/>').text(file.key).attr('data-url',this._options.ossPath + file.value);
            _file.on('click',function(){
                _this.insertFileSuccess([{
                    type:10,        //type 枚举 10 图片  20 音频 30 视频  1 其它
                    name:_file.text(),
                    path:_file.data('url')
                }]);
            });
            $(`#recent_${this._editorTimeID}`).append(_file);
        }
    }
    
    _showEditor(){
        let [container,textarea,dateNow] = [this._element,'',(new Date()).getTime()];
        let editorToolbar = $('<div/>',{
            'class': 'toolbar'
        });
        this._editorTimeID = dateNow;
        editorToolbar = this._buildButtons(this._options.buttons,editorToolbar,container,dateNow);
        if (container.is('textarea')) {
            container.parent().before(editorToolbar);
            textarea = container;
        }
        if (!this._options.showToolbar) {
            editorToolbar.css('display','none');

            this._element.on('focus',function(){
                editorToolbar.css('display','');
            }).on('blur',function(){
                editorToolbar.css('display','none');
            });
        }
        let file_upload = $('<input/>').attr({type:"file",id:`file_${this._editorTimeID}`}).css('display','none');
        file_upload.on('change',(e)=>{
            this._uploadFile(e.target.files[0]);
        });
        container.parent().attr('id',`drop_${dateNow}`).append(file_upload);
        container.parent().parent().attr('id', dateNow);
        if (this._options.width !== "") {
            container.parent().parent().css({'width':`${this._options.width}`});
        }
        if (this._options.height !== "") {
            container.css({'height':`${this._options.height}`});
        }
        if (this._options.editorContent !== "") {
            container.val(this._options.editorContent);
        }
        container.addClass('md-input');
    }

    _getSelection(){
        let e = this._element[0];
        return (
            ('selectionStart' in e && function(){
                let l = e.selectionEnd - e.selectionStart;
                return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) };
            }) ||
            /* browser not supported */
            function(){
                return null;
            }
        )();
    }

    _replaceSelection(text){
        let e = this._element[0];
        return (
            ('selectionStart' in e && function () {
                e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length);
                e.selectionStart = e.value.length;
                return this;
            }) ||
            function () {
                e.value += text;
                return jQuery(e);
            }
        )();
    }

    _setSelection(start, end){
        let e = this._element[0];
        return (
            ('selectionStart' in e && function () {
                e.selectionStart = start;
                e.selectionEnd = end;
                return;
            }) ||
            function () {
                return null;
            }
        )();
    }

    _buildButtons(buttonsArray, container, textarea, dateNow){
        let [_this] = [this];
        for (let i = 0; i < buttonsArray.length; i++) {
            let [buttons,btnGroup]=[buttonsArray[i],];
            if (i==0) {
                btnGroup = $('<div/>', {'class': 'option'});
            }else{
                btnGroup = $('<div/>', {'class': 'side'});
            }
            for (let j = 0; j < buttons.length; j++) {
                let [buttonSort,btnGroupContainer] = [buttons[j],$('<span/>',{'class':'cell'})];
                for (let k = 0; k < buttonSort.data.length; k++) {
                    let [button,buttonContainer] = [buttonSort.data[k],];
                    buttonContainer = $('<button></button>');
                    buttonContainer.attr('title',button.title).attr('data-handler',button.name).attr('type','button');
                    if (button.name !== 'loading' && button.name !== 'loadead') {
                        buttonContainer.text(button.text);
                    }
                    if (button.icon.length>0) {
                        for (let l = 0; l < button.icon.length; l++) {
                            let icon = button.icon[l];
                            let iconContainer = $('<i/>',{'class':`${icon.glyph}`});
                            buttonContainer.append(iconContainer);
                        }
                    }
                    if (button.name === 'loading' || button.name === 'loadead') {
                        if (button.name === 'loading') {
                            this._loadingEl = buttonContainer;
                        }else{
                            this._loadeadEl = buttonContainer;
                        }
                        buttonContainer.append(button.text).css('display','none');                      
                    }
                    if (button.submenu.length>0) {
                        let _class = "list";
                        if (button.name == "image") {
                            _class = "list list-image";
                        }
                        let dialog = $('<div/>',{'class':'menu-popup', 'style':'display: none;'});
                        let _dialog_submenus = $('<div/>',{'class':`${_class}`});
                        for (let m = 0; m < button.submenu.length; m++) {
                            let submenu = button.submenu[m];
                            if (submenu.handler === "insertImage" && !$.isFunction(this._options.insertFileCall)) {
                                continue;
                            }
                            if (submenu.handler === "uploadImage" && this._options.uploadPath === "") {
                                continue;
                            }
                            if (submenu.handler === "recent" && this._options.recentFiles.length === 0) {
                                continue;
                            }
                            let _spanContainer = $(`<${submenu.element}/>`,{'class':`${submenu.class}`,'title':`${submenu.title}`,'value':`${submenu.value}`});
                            _spanContainer.text(`${submenu.text}`);
                            submenu.handler!==""?_spanContainer.attr("data-handler",submenu.handler):"";
                            if (submenu.callback !== "") {
                                _spanContainer.on('click',function(){
                                    submenu.callback(this,_this);
                                });
                            }
                            if (submenu.title === "div") {
                                _spanContainer.attr("id",`recent_${dateNow}`);
                            }
                            _dialog_submenus.append(_spanContainer);
                        }
                        dialog.append(_dialog_submenus);
                        dialog.attr('id',`${button.name}_${dateNow}`);
                        textarea.parent().after(dialog);
                    }
                    buttonContainer.on('click',function(event){
                        button.callback(this, _this, event);
                    });
                    btnGroupContainer.append(buttonContainer);
                }
                btnGroup.append(btnGroupContainer);
            }
            container.append(btnGroup);
        }
        return container;
    }

    showPreview(){
        let replacementContainer = $('<div/>', { 'class': 'md-preview', 'data-provider': 'markdown-preview' });
        let [container,content,val,_this] = [this._element,'',this._element.val(),this];
        if (this._isPreview == true) {
            return this;
        }
        this._isPreview = true;
        if (typeof marked == 'function') {
            content = marked(val);
        } else {
            content = val;
        }
        container.hide();
        replacementContainer.html(content);
        //超链接更改打开方式。
        replacementContainer.find('a[href]').each(function(){
            $(this).attr('target', '_blank');
        });
        //替换图片路径 45.76.211.28 www.iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.com
        replacementContainer.find('img[src]').each(function(){
            let _src = $(this).attr('src');
            _src = _this._options.recentFiles.find(function(file){
                if (file.key == _src) {
                    return file;
                }
            }).value;
            $(this).attr('src', `${_this._options.ossPath}${_src}`);
        });
        container.parent().append(replacementContainer);
        replacementContainer.css({
            width: container.outerWidth() + 'px',
            height: container.outerHeight() + 'px',
            overflow:"auto",
            resize:this._options.resize
        });
        replacementContainer.data('markdown', this);
        this.disableButtons('preview');
        return this;
    }


    hidePreview(){
        this._isPreview = false;
        let container = this._element.parent().find('div[data-provider="markdown-preview"]');
        container.remove();
        this.enableButtons('preview');
        this._element.show();
        return this;
    }

    help(){}

    enableButtons(key){
        $(`#${this._editorTimeID}`).find('button[data-handler]').each(function(){
            let _handler = $(this).data('handler');
            if (_handler !== key) {
                $(this).removeAttr('disabled');
            }
        });
    }

    disableButtons(key){
        $(`#${this._editorTimeID}`).find('button[data-handler]').each(function(){
            let _handler = $(this).data('handler');
            if (_handler !== key) {
                $(this).attr('disabled', 'disabled');
            }
        });
    }
    /*
    file[{
        type:10,        type 枚举 10 图片  20 音频 30 视频  1 其它
        name:fileName,
        path:filePath
    }]
    */
    insertFileSuccess(file){
        let _this = this;
        file=file[0];
        switch(file.type){
            case 10:
                _this._insertImageToEditor(file);
                break;
            case 20:
                break;
            case 30:
                break;
            default:
                break;
        }
    }
    insertFileError(msg){
        alert(msg);
    }
    /*
    file[{
        type:10,        type 枚举 10 图片  20 音频 30 视频  1 其它
        name:fileName,
        path:filePath
    }]
    */
    uploadFileSuccess(file){
        let _this = this;
        file=file[0];
        switch(file.type){
            case 10:
                _this._insertImageToEditor(file);
                break;
            case 20:
                break;
            case 30:
                break;
            default:
                break;
        }
        $(this._loadingEl).css('display','none');
        $(this._loadeadEl).css('display','');
        setTimeout(function(){
            $(_this._loadeadEl).fadeOut(500);
        },1000);
        this._options.recentFiles.unshift({key:file.name,value:file.path});
        this._bindRecentFile(this._options.recentFiles);    //重新绑定最近上传的 5 张图片
    }

    uploadFileError(msg){
        $(this._loadingEl).css('display','none');
        alert(msg);
    }


    //{key:'icon_Apad1.png',value:'images/icon_Apad1.png'}
    //this._options.recentFiles.unshift({key:'icon_Apad1.png',value:'images/icon_Apad1.png'});
    _uploadFile(file){
        $(this._loadingEl).css('display','');
        if (!$.isFunction(this._options.uploadCall)) {
            //上传成功后更改本地的最近 5 张图片并重新显示。
            let [formData,_this] = [new FormData(),this];
            formData.append(this._options.uploadFileName, file);
            $.ajax({
                url:this._options.uploadPath,
                type:'POST',
                data:formData,
                cache: false,
                contentType: false,
                processData: false,
                success:function(data){
                    //console.log(data);
                    data = JSON.parse(data);
                    if (data.success) {
                        _this.uploadFileSuccess([{
                            type:_this._uploadType,
                            name:data.key,
                            path:data.value
                        }]);
                    }else{
                        _this.uploadFileError(data.msg);
                    }
                },
                error:function(msg){
                    _this.uploadFileError('上传错误，请稍后重试！');
                }
            });
        } else{
            this._options.uploadCall(file,this);
        }
    }    

    _toggleHeading(head){
        let [chunk, cursor, selected,content,pointer,prevChar,headLength] = [,,this._getSelection(),this.value,,,head.length];
        if (selected.length === 0) {
            chunk = '标题文本';
            this._replaceSelection(`\n${head} ${chunk}`);
            cursor = selected.start + 2;
        } else {
            if (selected.text.indexOf('\n') < 0) {
                this._replaceSelection(`${head} ` + selected.text);
                cursor = selected.start + head.length + 1;
            } else {
                var list = [];
                list = selected.text.split('\n');
                chunk = list[0];
                $.each(list, function (k, v) {
                    let pos = v.indexOf('# ');
                    if (pos >= 0) {
                        let _s = v.substr(0,pos+1);
                        let _sr = v.substr(pos+2,v.length-1);
                        if (_s === head) {
                            list[k] = `${_sr}`;
                        }else{
                            list[k] = `${head} ${_sr}`;
                        }
                    }else{
                        list[k] = `${head} ${v}`;
                    }
                });
                this._replaceSelection(list.join('\n'));//'\n' + list.join('\n')
                cursor = selected.start + 4;
            }
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _toggleCode(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];

        if (selected.length === 0) {
            chunk = '代码文本';
        } else {
            chunk = selected.text;
        }
        if (content.substr(selected.start - 4, 4) === '```\n'
            && content.substr(selected.end, 4) === '\n```') {
            this._setSelection(selected.start - 4, selected.end + 4);
            this._replaceSelection(chunk);
            cursor = selected.start - 4;
        } else if (content.substr(selected.start - 1, 1) === '`'
            && content.substr(selected.end, 1) === '`') {
            this._setSelection(selected.start - 1, selected.end + 1);
            this._replaceSelection(chunk);
            cursor = selected.start - 1;
        } else if (content.indexOf('\n') > -1) {
            this._replaceSelection('\n```' + chunk + '```\n');
            cursor = selected.start + 4;
        } else {
            this._replaceSelection('`' + chunk + '`');
            cursor = selected.start + 1;
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _toggleQuote(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];

        if (selected.length === 0) {
            chunk = '引用文本';
        } else {
            chunk = selected.text;
        }
        if (content.substr(selected.start - 2, 2) === '> ') {
            this._setSelection(selected.start - 2, selected.end);
            this._replaceSelection(chunk);
            cursor = selected.start - 2;
        } else {
            this._replaceSelection(`> ${chunk}`);
            cursor = selected.start + 2;
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _toggleBold(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];

        if (selected.length === 0) {
            chunk = '粗体文本';
        } else {
            chunk = selected.text;
        }
        if (content.substr(selected.start - 2, 2) === '**'
            && content.substr(selected.end, 2) === '**') {
            this._setSelection(selected.start - 2, selected.end + 2);
            this._replaceSelection(chunk);
            cursor = selected.start - 2;
        } else {
            this._replaceSelection(`**${chunk}**`);
            cursor = selected.start + 2;
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _togglePart(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];

        if (selected.length === 0) {
            chunk = '普通段落';
        } else {
            chunk = selected.text;
        }
        if (content.substr(selected.start - 2, 2) === '\n\n'
            && content.substr(selected.end, 2) === '\n\n') {
            this._setSelection(selected.start - 2, selected.end + 2);
            this._replaceSelection(chunk);
            cursor = selected.start - 2;
        } else {
            this._replaceSelection(`\n\n${chunk}\n\n`);
            cursor = selected.start + 2;
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _toggleItalic(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];

        if (selected.length === 0) {
            chunk = '斜体文本';
        } else {
            chunk = selected.text;
        }
        if (content.substr(selected.start - 1, 1) === '_'
            && content.substr(selected.end, 1) === '_') {
            this._setSelection(selected.start - 1, selected.end + 1);
            this._replaceSelection(chunk);
            cursor = selected.start - 1;
        } else {
            this._replaceSelection(`_${chunk}_`);
            cursor = selected.start + 1;
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _unorderedList(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];

        if (selected.length === 0) {
            chunk = '列表文本';
            this._replaceSelection(`- ${chunk}`);
            cursor = selected.start + 2;
        } else {
            if (selected.text.indexOf('\n') < 0) {
                chunk = selected.text;
                this._replaceSelection('- ' + chunk);
                cursor = selected.start + 2;
            } else {
                var list = [];
                list = selected.text.split('\n');
                chunk = list[0];
                list = this._replaceList1(list,'- ');
                this._replaceSelection(list.join('\n'));//'\n' + list.join('\n')
                cursor = selected.start + 4;
            }
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _orderedList(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];

        if (selected.length === 0) {
            chunk = '列表文本';
            this._replaceSelection(`1. ${chunk}`);
            cursor = selected.start + 3;
        } else {
            if (selected.text.indexOf('\n') < 0) {
                chunk = selected.text;
                this._replaceSelection(`1. ${chunk}`);
                cursor = selected.start + 3;
            } else {
                var list = [];
                list = selected.text.split('\n');
                chunk = list[0];
                list = this._replaceList1(list,'1. ');
                this._replaceSelection(list.join('\n'));//'\n' + list.join('\n')
                cursor = selected.start + 5;
            }
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    _replaceList1(list, chunkType){
        let _this = this;
        $.each(list, function (k, v) {
            if (v.substr(0,2) === '- ') {
                if (chunkType === '- ') {
                    list[k] = v.substr(2,v.length);
                }else{
                    list[k] = chunkType + v.substr(2,v.length);
                }
            }else if (v.substr(0,3)=== '1. ') {
                if (chunkType === '1. ') {
                    list[k] = v.substr(3,v.length);
                }else{
                    list[k] = chunkType + v.substr(3,v.length);
                }
            }else{
                list[k] = `${chunkType}${v}`;
            }
        });
        return list;
    }

    //把图片添加到编辑器里
    _insertImageToEditor(file){
        let [chunk, cursor, selected, content, link, title] = [,,this._getSelection(),this.value,,];
        if (selected.length === 0) {
            chunk = '在这里输入图片描述';
            title = '在这里输入标题';
        } else {
            chunk = selected.text;
            title = file.name;
        }
        link = file.name;
        //let urlRegex = new RegExp('^((http|https)://|(mailto:)|(//))[a-z0-9]', 'i');
        if (link !== null && link !== '') {
            this._replaceSelection(`![${chunk}](${file.name} "${title}")`);
            cursor = selected.start + 1;
            this._setSelection(cursor, cursor + chunk.length);
        }
    }

    _insertLink(){
        let [chunk, cursor, selected, content, link] = [,,this._getSelection(),this.value,];
        if (selected.length === 0) {
            chunk = '在这里输入链接描述';
        } else {
            chunk = selected.text;
        }
        link = prompt('插入超链接', 'http://');
        //let urlRegex = new RegExp('^((http|https)://|(mailto:)|(//))[a-z0-9]', 'i');
        if (link !== null && link !== '' && link !== 'http://') {
            let sanitizedLink = $(`<div>${link}</div>`).text();
            this._replaceSelection(`[${chunk}](${sanitizedLink})`);
            cursor = selected.start + 1;
            this._setSelection(cursor, cursor + chunk.length);
        }
    }

    _insertTable(){
        let [chunk, cursor, selected, content] = [,,this._getSelection(),this.value];
        if (selected.length === 0) {
            chunk = '表格文本';
            this._replaceSelection(`| head 1   | head 2   |\n|:--------:|:--------:|\n| col 1    | col 2    |`);
            cursor = selected.start + 3;
        }
        this._setSelection(cursor, cursor + chunk.length);
    }

    showAllUploadStatus(element){}
}

$.fn.markdown = function (option) {
    return this.each(function () {
        let $this = $(this)
            , data = $this.data('markdown')
            , options = typeof option == 'object' && option;
        if (!data) {$this.data('markdown', (data = new Editor(this, options)));}
    });
};
/*
recentFiles:[],         //最近上传的 5 张图片(必要参数)
uploadPath:'upload.php',//图片上传路径(必要参数)
ossPath:'',             //ossPath(必要参数)
activeClass:"edit-area-hover", //拖拽文件进入上传区域样式(可选参数)
editorContent:'',       //预加载内容(可选参数)
width: 'inherit',       //编辑器长度 单位（px） 默认 100%(可选参数)
height: 'inherit',      //编辑器高度 单位（px） 默认 100%(可选参数)
resize: 'none',         //both 预览的浮层是否允许放大缩小
uploadFileName:'upload_file',  //上传图片的接收 fileName
uploadCall:'',          //上传方法(必要参数)(参数1：文件 参数2：editor)
insertFileCall:'',      //插入方法 如果此字段为空则不显示插入图片的功能按钮(必要参数)
showToolbar:true,      //是否显示 ToolBar
*/

$.fn.markdown.defaults = {
    recentFiles:[],         //最近上传的 5 张图片(必要参数)
    uploadPath:'upload.php',//图片上传路径(必要参数)
    ossPath:'',             //ossPath(必要参数)
    activeClass:"edit-area-hover", //拖拽文件进入上传区域样式(可选参数)
    editorContent:'',       //预加载内容(可选参数)
    width: 'inherit',       //编辑器长度 单位（px） 默认 100%(可选参数)
    height: 'inherit',      //编辑器高度 单位（px） 默认 100%(可选参数)
    resize: 'none',         //both 预览的浮层是否允许放大缩小
    uploadFileName:'upload_file',  //上传图片的接收 fileName
    uploadCall:'',          //上传方法(必要参数)(参数1：文件 参数2：editor)
    insertFileCall:'',      //插入方法 如果此字段为空则不显示插入图片的功能按钮(必要参数)
    showToolbar:true,      //是否显示 ToolBar
    buttons:[
    [{
        name:'groupHeading',
        data:[{
            name: 'heading',
            title: '标题',
            text:'样式',
            submenu:[{element:"span",class:"",title:"普通段落",handler:"p",value:"",text:"普通段落",callback:function(el,ed){
                ed._togglePart();
            }},{element:"span",class:"h1",title:"标题1",handler:"heading",value:"1",text:"标题1",callback:function(el,ed){
                ed._toggleHeading("#");
            }},{element:"span",class:"h2",title:"标题2",handler:"heading",value:"2",text:"标题2",callback:function(el,ed){
                ed._toggleHeading("##");
            }},{element:"span",class:"h3",title:"标题3",handler:"heading",value:"3",text:"标题3",callback:function(el,ed){
                ed._toggleHeading("###");
            }},{element:"span",class:"h4",title:"标题4",handler:"heading",value:"4",text:"标题4",callback:function(el,ed){
                ed._toggleHeading("####");
            }},{element:"span",class:"h5",title:"标题5",handler:"heading",value:"5",text:"标题5",callback:function(el,ed){
                ed._toggleHeading("#####");
            }},{element:"span",class:"h6",title:"标题6",handler:"heading",value:"6",text:"标题6",callback:function(el,ed){
                ed._toggleHeading("######");
            }},{element:"span",class:"",title:"引用",handler:"code",value:"",text:"引用",callback:function(el,ed){
                ed._toggleQuote();
            }}],
            icon: [{ glyph: 'iconeditor icon-caret'}],
            callback: function(el, ed, event){
                event.stopPropagation();
                $(`#${ed._editorTimeID}>.menu-popup`).hide();
                let _el = $(`#heading_${ed._editorTimeID}`);
                _el.show().css({"left":el.offsetLeft,"top":(el.offsetTop+el.clientHeight)});
            }
        }]
    },{
        name:'groupFont',
        data:[{
            name: 'bold',
            title: '加粗',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-bold'}],
            callback: function(el, ed){
                ed._toggleBold();
            }
        },{
            name: 'italic',
            title: '倾斜',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-italic'}],
            callback: function(el, ed){
                ed._toggleItalic();
            }
        }]
    },{
        name:'groupList',
        data:[{
            name: 'unordered-list',
            title: '无序列表',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-ul-list'}],
            callback: function(el,ed){
                ed._unorderedList();
            }
        },{
            name: 'ordered-list',
            title: '有序列表',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-ol-list'}],
            callback: function(el,ed){
                ed._orderedList();
            }
        }]
    },{
        name:'groupMake',
        data:[{
            name: 'link',
            title: '链接',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-link'}],
            callback: function(el,ed){
                ed._insertLink();
            }
        },{
            name: 'table',
            title: '表格',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-table'}],
            callback: function(el,ed){
                ed._insertTable();
            }
        }]
    },{
        name:'groupMisc',
        data:[{
            name: 'image',
            title: '图片',
            text:'',
            submenu:[{element:"span",class:"",title:"",handler:"recent",value:"",text:"最近添加",callback:""},
            {element:"div",class:"images",title:"div",handler:"",value:"",text:"",callback:""},
            {element:"hr",class:"",title:"",handler:"",value:"",text:"",callback:""},
            {element:"span",class:"",title:"",handler:"insertImage",value:"",text:"插入图片",callback:function(el,ed){
                if (typeof ed._options.insertFileCall === "function") {
                    ed._options.insertFileCall(ed);
                }
            }},{element:"span",class:"",title:"",handler:"uploadImage",value:"",text:"上传图片",callback:function(el,ed){
                $(`#file_${ed._editorTimeID}`).click();
            }}],
            icon: [{ glyph: 'iconeditor icon-image'},{ glyph: 'iconeditor icon-caret'}],
            callback: function(el,ed, event){
                event.stopPropagation();
                ed._uploadType = 10;
                $(`#${ed._editorTimeID}>.menu-popup`).hide();
                let _el = $(`#image_${ed._editorTimeID}`);
                _el.show().css({"left":el.offsetLeft,"top":(el.offsetTop + el.clientHeight)});
            }
        }]
    }],[{
        name:'groupSide',
        data:[{
            name: 'loading',
            title: 'Loading',
            text:'正在上传<span>1</span>个文件',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-renew'}],
            callback: function(el,ed){
                ed.showAllUploadStatus(el);
            }
        },{
            name: 'loadead',
            title: 'Loadead',
            text:'文件上传完成',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-ok'}],
            callback: function(el,ed){
                ed.showAllUploadStatus(el);
            }
        },{
            name: 'preview',
            title: '预览',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-search'}],
            callback: function(el,ed){
                var isPreview = ed._isPreview;
                if (!isPreview) {
                    ed.showPreview();
                } else {
                    ed.hidePreview();
                }
            }
        },{
            name: 'help',
            title: '帮助',
            text:'',
            submenu:[],
            icon: [{ glyph: 'iconeditor icon-help'}],
            callback: function(el,ed){
                ed.help();
            }
        }]
    }]]
};