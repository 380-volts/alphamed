///<reference path="../Main/App.ts"/>
///<reference path="DynForm.ts"/>
///<reference path="../3rdLibs/Definitions/cleave.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var DynFormViewer = /** @class */ (function () {
    function DynFormViewer() {
    }
    DynFormViewer.prototype.Init = function (containerElement, formDefinition, fieldPrefix, bootstrap3, formHint) {
        formDefinition = formDefinition || { fields: [] };
        this.bootstrap3 = bootstrap3 || false;
        this.containerElement = containerElement;
        //this.containerElement.style.display = 'block';
        //this.containerElement.style.maxHeight = '200px';
        //this.containerElement.style.position = 'relative';
        //$(this.containerElement).jsScroll();
        this.fieldPrefix = fieldPrefix;
        this.formHint = formHint || '';
        this.RefreshData(formDefinition);
        this.initialized = true;
    };
    DynFormViewer.prototype.Reset = function () {
        console.log('reseting...', this.initialized);
        if (!this.initialized)
            return;
        this.RefreshData({ fields: [] });
    };
    DynFormViewer.prototype.RefreshData = function (formDefinition) {
        _.each(formDefinition.fields, function (field, index) {
            field.id = field.name + "-" + index;
        });
        this.formDefinition = __assign({}, formDefinition);
        this.Render();
    };
    DynFormViewer.prototype.GetCurrentFormDefinition = function () {
        return this.formDefinition;
    };
    DynFormViewer.prototype.TriggerOnChange = function (formHtml, fieldValues) {
        //console.log('React html', formHtml);
        if (this.onChange)
            this.onChange(formHtml, fieldValues);
    };
    DynFormViewer.prototype.TriggerOnRenderHtmlElement = function (element) {
        //console.log(['TriggerOnRenderHtmlElement', element]);
        if (this.onRenderHtmlElement)
            this.onRenderHtmlElement(element);
    };
    DynFormViewer.prototype.TriggerOnPaste = function (ev) {
        //console.log(['TriggerOnPaste', ev]);
        if (this.onPaste)
            this.onPaste(ev);
    };
    DynFormViewer.prototype.TriggerOnDrop = function (ev) {
        //console.log(['TriggerOnDrop', ev]);
        if (this.onDrop)
            this.onDrop(ev);
    };
    DynFormViewer.prototype.Render = function () {
        var _this = this;
        this.containerElement.className += ' dynform-container';
        Utils.RequireReact(function () {
            //console.log('rendering2', this.formDefinition);
            ReactDOM.render(React.createElement(DynFormViewerComponent, { formDefinition: _this.formDefinition, formHint: _this.formHint, cssFramework: (_this.bootstrap3 ? CssFramework.Bootstrap3 : CssFramework.Bootstrap2), formFieldsPrefix: _this.fieldPrefix, onChange: function (formHtml, fieldValues) { return _this.TriggerOnChange(formHtml, fieldValues); }, onPaste: function (ev) { return _this.TriggerOnPaste(ev); }, onDrop: function (ev) { return _this.TriggerOnDrop(ev); }, onRenderHtmlElement: function (element) { return _this.TriggerOnRenderHtmlElement(element); } }), _this.containerElement, function () {
                UI.TriggerModalBodyResize();
            });
        });
    };
    return DynFormViewer;
}());
var DynFormViewerComponent = /** @class */ (function (_super) {
    __extends(DynFormViewerComponent, _super);
    function DynFormViewerComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.state = __assign({}, props, { onChange: props.onChange, onPaste: props.onPaste, onDrop: props.onDrop, onRenderHtmlElement: props.onRenderHtmlElement, formFieldsPrefix: props.formFieldsPrefix, formHint: props.formHint, formHtml: '', fieldValues: {}, fieldCaptions: {}, fieldTexts: {} });
        _this.cleaves = [];
        _this.initializedFields = [];
        return _this;
    }
    DynFormViewerComponent.prototype.componentWillReceiveProps = function (newProps) {
        this.setState(function (state) {
            return __assign({}, state, { onChange: newProps.onChange, onPaste: newProps.onPaste, onDrop: newProps.onDrop, onRenderHtmlElement: newProps.onRenderHtmlElement, formHint: newProps.formHint, formFieldsPrefix: newProps.formFieldsPrefix, formDefinition: newProps.formDefinition });
        });
        //console.log('componentWillReceiveProps', newProps);
    };
    DynFormViewerComponent.prototype.render = function () {
        var _this = this;
        var divProperties = {
            className: "dynform",
            id: "dynform",
            onDrop: function (e) { _this.triggerOnDrop(e); }
        };
        var getFormHint = function () { return React.createElement(React.Fragment, null,
            React.createElement("h4", { style: { marginTop: 0, marginBottom: 20, height: '100%' } }, _this.state.formHint.split("\n").map(function (x) { return React.createElement(React.Fragment, null,
                React.createElement("span", null,
                    " ",
                    x),
                React.createElement("br", null)); }))); };
        return React.createElement("div", __assign({}, divProperties),
            this.state.formHint ? getFormHint() : "",
            this.state.formDefinition.fields.map(function (field) { return _this.renderField(field); }));
    };
    DynFormViewerComponent.prototype.renderField = function (fieldDefinition) {
        var _this = this;
        var renderField;
        if (fieldDefinition.fieldType == DynForm.FieldType.TextBox)
            renderField = function (x) { return _this.renderTextbox(x); };
        else if (fieldDefinition.fieldType == DynForm.FieldType.DropDown)
            renderField = function (x) { return _this.renderDropdown(x); };
        else if (fieldDefinition.fieldType == DynForm.FieldType.TextArea)
            renderField = function (x) { return _this.renderTextarea(x); };
        else if (fieldDefinition.fieldType == DynForm.FieldType.HtmlBox)
            renderField = function (x) { return _this.renderHtmlBox(x); };
        var getFieldHint = function () { return React.createElement(React.Fragment, null,
            React.createElement("br", null),
            React.createElement("small", null,
                React.createElement("small", null, fieldDefinition.hint))); };
        //<div key={fieldDefinition.name} className="row"><div className="col-md-4">{fieldDefinition.caption}</div><div className="col-md-8">{renderField(fieldDefinition)} {(fieldDefinition.required ? <small>*&nbsp;{Resources.Commons.Required}</small> : <></>)}</div></div>
        //return <div key={fieldDefinition.name} className="row-fluid"><div className="span4">{fieldDefinition.caption}</div><div className="span8">{renderField(fieldDefinition)} {(fieldDefinition.required ? <small>*&nbsp;{Resources.Commons.Required}</small> : <></>)}</div></div>
        if (this.state.cssFramework == CssFramework.Bootstrap3)
            return [
                React.createElement("div", { key: fieldDefinition.name + 'label', className: "row" },
                    React.createElement("div", { className: "col-md-12" },
                        fieldDefinition.caption,
                        fieldDefinition.hint ? getFieldHint() : "")),
                React.createElement("div", { key: fieldDefinition.name + 'field', className: "row" },
                    React.createElement("div", { className: "col-md-12" },
                        renderField(fieldDefinition),
                        " ",
                        (fieldDefinition.required && fieldDefinition.fieldType != DynForm.FieldType.HtmlBox ? React.createElement("small", null,
                            "*\u00A0",
                            Resources.Commons.Required) : React.createElement(React.Fragment, null))))
            ];
        else
            return [
                React.createElement("div", { key: fieldDefinition.name + 'label' },
                    fieldDefinition.caption,
                    fieldDefinition.hint ? getFieldHint() : ""),
                React.createElement("div", { key: fieldDefinition.name + 'field', className: "row-fluid" },
                    React.createElement("div", { className: "span12" },
                        renderField(fieldDefinition),
                        " ",
                        (fieldDefinition.required && fieldDefinition.fieldType != DynForm.FieldType.HtmlBox ? React.createElement("small", null,
                            "*\u00A0",
                            Resources.Commons.Required) : React.createElement(React.Fragment, null))))
            ];
    };
    DynFormViewerComponent.prototype.htmlAsText = function (html) {
        return (html || '').replace(/<[^>]*>/gi, '');
    };
    DynFormViewerComponent.prototype.setFieldValue = function (name, value, caption, text, keepHtml) {
        //console.log('setFieldValue', name, value, caption, text, text || value);
        var _this = this;
        value = value.replace(/</gi, '&lt;').replace(/>/gi, '&gt;');
        if (text && !keepHtml)
            text = text.replace(/</gi, '&lt;').replace(/>/gi, '&gt;').replace(/\n/gi, '<br/>');
        this.setState(function (state) {
            var _a, _b, _c;
            var fieldValues = __assign({}, state.fieldValues, (_a = {}, _a[name] = value, _a));
            var fieldCaptions = __assign({}, state.fieldCaptions, (_b = {}, _b[name] = caption || name, _b));
            var fieldTexts = __assign({}, state.fieldTexts, (_c = {}, _c[name] = (text || value), _c));
            var formHtml = _this.buildHtml(fieldCaptions, fieldTexts);
            _this.triggerOnChange(formHtml, fieldValues);
            return __assign({}, state, { fieldValues: fieldValues, fieldCaptions: fieldCaptions, fieldTexts: fieldTexts, formHtml: formHtml });
        });
    };
    DynFormViewerComponent.prototype.triggerOnChange = function (formHtml, fieldValues) {
        //console.log('component onchange2', formHtml);
        if (this.state.onChange)
            this.state.onChange(formHtml, fieldValues);
    };
    DynFormViewerComponent.prototype.triggerOnPaste = function (ev) {
        if (this.state.onPaste)
            this.state.onPaste(ev);
    };
    DynFormViewerComponent.prototype.triggerOnDrop = function (ev) {
        if (this.state.onDrop)
            this.state.onDrop(ev);
    };
    DynFormViewerComponent.prototype.triggerOnRenderHtmlElement = function (element) {
        if (this.state.onRenderHtmlElement)
            this.state.onRenderHtmlElement(element);
    };
    DynFormViewerComponent.prototype.buildHtml = function (fieldCaptions, fieldTexts) {
        //console.log('buildHtml', fieldCaptions, fieldTexts);
        return _(this.state.formDefinition.fields).filter(function (k) { return !!fieldCaptions[k.name]; }).map(function (k) { return [
            fieldCaptions[k.name],
            fieldTexts[k.name] || '',
            k.fieldType == DynForm.FieldType.HtmlBox || k.fieldType == DynForm.FieldType.TextArea
        ]; }).map(function (x) { return "<p><b>" + x[0] + "</b> " + (x[2] ? '<br/>' : '') + " " + x[1] + "</p>"; }).join(' ');
    };
    DynFormViewerComponent.prototype.getFieldName = function (fieldDefinition) {
        return this.state.formFieldsPrefix + '.' + fieldDefinition.name.replace(/ /gi, '');
    };
    DynFormViewerComponent.prototype.getFieldID = function (fieldDefinition) {
        return this.state.formFieldsPrefix + '-' + fieldDefinition.id.replace(/ /gi, '');
    };
    DynFormViewerComponent.prototype.setDateFieldInputMask = function (field, fieldDefinition) {
        var _this = this;
        console.log('setDateFieldInputMask 2');
        if (this.initializedFields.indexOf(field) > -1)
            return;
        $(field).datepicker({
            format: environmentData.RegionalSettings.MomentShortDateFormat.toLowerCase(),
            autoclose: true
        }).on('changeDate', function (e) {
            _this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption);
        });
        this.cleaves.push(undefined);
        this.initializedFields.push(field);
    };
    DynFormViewerComponent.prototype.setIntegerFieldInputMask = function (field, fieldDefinition) {
        var _this = this;
        console.log('setDecimalFieldInputMask');
        if (this.initializedFields.indexOf(field) > -1)
            return;
        var cleave = new Cleave(field, {
            numeral: true,
            numeralDecimalScale: 0,
            numeralDecimalMark: environmentData.RegionalSettings.DecimalSeparator,
            numeralThousandsGroupStyle: 'none',
            onValueChanged: function (e) { return _this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption); }
        });
        this.cleaves.push(cleave);
        this.initializedFields.push(field);
        //console.log(cleave);
    };
    DynFormViewerComponent.prototype.setDecimalFieldInputMask = function (field, fieldDefinition) {
        var _this = this;
        console.log('setDecimalFieldInputMask');
        if (this.initializedFields.indexOf(field) > -1)
            return;
        var cleave = new Cleave(field, {
            numeral: true,
            numeralDecimalScale: 2,
            numeralDecimalMark: environmentData.RegionalSettings.DecimalSeparator,
            numeralThousandsGroupStyle: 'none',
            onValueChanged: function (e) { return _this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption); }
        });
        this.cleaves.push(cleave);
        this.initializedFields.push(field);
        //console.log(cleave);
    };
    DynFormViewerComponent.prototype.renderTextbox = function (fieldDefinition) {
        var _this = this;
        if (fieldDefinition.textType == DynForm.TextBoxType.Date)
            return this.renderDateField(fieldDefinition); //Inpput encapsulado
        //var inputStep = ({ [DynForm.TextBoxType.Text]: undefined, [DynForm.TextBoxType.Integer]: 1, [DynForm.TextBoxType.Decimal]: undefined })[fieldDefinition.textType];
        //var pattern = ({ [DynForm.TextBoxType.Text]: undefined, [DynForm.TextBoxType.Integer]: '^[0-9]*$', [DynForm.TextBoxType.Decimal]: '^[0-9.,]*$'})[fieldDefinition.textType];
        var pattern = undefined;
        var inputStep = undefined;
        //var inputType = ({ [DynForm.TextBoxType.Text]: 'text', [DynForm.TextBoxType.Integer]: 'number', [DynForm.TextBoxType.Decimal]: 'text' })[fieldDefinition.textType];
        var inputType = 'text';
        var width = '80px';
        if (fieldDefinition.textType == DynForm.TextBoxType.Decimal)
            width = Math.min(300, Math.max(110, 30 + 15 * (fieldDefinition.maxLength || 0))) + 'px';
        else
            width = Math.min(300, Math.max(80, 15 * (fieldDefinition.maxLength || 0))) + 'px';
        return React.createElement("input", { id: this.getFieldID(fieldDefinition), name: this.getFieldName(fieldDefinition), ref: function (e) {
                if (!e)
                    return;
                if (fieldDefinition.textType == DynForm.TextBoxType.Integer)
                    _this.setIntegerFieldInputMask(e, fieldDefinition);
                else if (fieldDefinition.textType == DynForm.TextBoxType.Decimal)
                    _this.setDecimalFieldInputMask(e, fieldDefinition);
            }, type: inputType, onChange: function (e) { return _this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption); }, 
            //onInput={(e) => this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption)}
            required: fieldDefinition.required, step: inputStep, pattern: pattern, style: { "width": width }, maxLength: fieldDefinition.maxLength });
    };
    DynFormViewerComponent.prototype.renderDateField = function (fieldDefinition) {
        var _this = this;
        var pattern = undefined;
        var inputStep = undefined;
        var inputType = 'text';
        var width = '300px';
        return React.createElement("div", { className: "input-prepend" },
            React.createElement("span", { className: "add-on", onClick: function (e) { return $(e.target).next("input[type=text]").datepicker("show"); } },
                React.createElement("i", { className: "icon-calendar-empty" })),
            React.createElement("input", { id: this.getFieldID(fieldDefinition), name: this.getFieldName(fieldDefinition), ref: function (e) {
                    if (!e)
                        return;
                    _this.setDateFieldInputMask(e, fieldDefinition);
                }, type: inputType, onChange: function (e) { return _this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption); }, 
                //onInput={(e) => this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption)}
                required: fieldDefinition.required, step: inputStep, pattern: pattern, style: { "width": width }, maxLength: fieldDefinition.maxLength }));
    };
    DynFormViewerComponent.prototype.renderDropdown = function (fieldDefinition) {
        var _this = this;
        return React.createElement("select", { id: this.getFieldID(fieldDefinition), name: this.getFieldName(fieldDefinition), onChange: function (e) {
                _this.setFieldValue(fieldDefinition.name, e.target.selectedOptions[0].value, fieldDefinition.caption, e.target.selectedOptions[0].text);
            }, required: fieldDefinition.required }, [React.createElement("option", { key: "select", value: "" }, Resources.Commons.Select)].concat(fieldDefinition.listOptions.map(function (lo) {
            return React.createElement("option", { key: lo.value, value: lo.value }, lo.text);
        })));
    };
    DynFormViewerComponent.prototype.autoResize = function (textarea) {
        var minRows = 3;
        textarea.rows = minRows;
        var lineHeight = 20; //height of each line
        var baseScrollHeight = 68; //scroll height for 3 lines
        var rows = Math.ceil((textarea.scrollHeight - baseScrollHeight) / lineHeight);
        textarea.rows = minRows + rows;
    };
    DynFormViewerComponent.prototype.renderTextarea = function (fieldDefinition) {
        var _this = this;
        return React.createElement("textarea", { rows: 3, id: this.getFieldID(fieldDefinition), name: this.getFieldName(fieldDefinition), onChange: function (e) { return _this.setFieldValue(fieldDefinition.name, e.target.value, fieldDefinition.caption, e.target.value); }, style: { width: "calc(90% - 10px)", overflow: "hidden" }, onInput: function (e) { return _this.autoResize(e.target); }, required: fieldDefinition.required });
    };
    DynFormViewerComponent.prototype.renderHtmlBox = function (fieldDefinition) {
        var _this = this;
        return React.createElement(HtmlTextArea, { id: this.getFieldID(fieldDefinition), name: this.getFieldName(fieldDefinition), onChange: function (content, textContent) { return _this.setFieldValue(fieldDefinition.name, textContent, fieldDefinition.caption, content, true); }, onPaste: function (ev) { return _this.triggerOnPaste(ev); }, onRenderHtmlElement: function (element) { return _this.triggerOnRenderHtmlElement(element); } });
    };
    return DynFormViewerComponent;
}(React.Component));
var HtmlTextArea = /** @class */ (function (_super) {
    __extends(HtmlTextArea, _super);
    function HtmlTextArea(props) {
        var _this = _super.call(this, props) || this;
        _this.stateControlledActions = ['bold', 'insertOrderedList'];
        _this.state = __assign({}, props, { textContent: _this.htmlAsText(_this.props.content), activeFormatActions: [] });
        return _this;
    }
    HtmlTextArea.prototype.htmlAsText = function (html) {
        return (html || '').replace(/<[^>]*>/gi, '');
    };
    HtmlTextArea.prototype.getDefaultDivStyles = function () {
        if (this.state.disableDefaultStyles)
            return {};
        return {
            width: "calc(90% - 10px)",
            minHeight: "90px",
            //height: "90px",
            //overflow: 'scroll',
            border: '1px solid #c0c0c0',
            padding: '2px 5px',
            fontSize: '15px',
            fontFamily: '"Segoe UI",Frutiger,"Frutiger Linotype","Dejavu Sans","Helvetica Neue",Arial,sans-serif'
        };
    };
    HtmlTextArea.prototype.wrapLinks = function () {
        var originalContent = this.divElement.innerHTML;
        var cleanContent = UI.WrapLinks(this.divElement.innerHTML);
        if (cleanContent != originalContent)
            this.divElement.innerHTML = cleanContent;
    };
    HtmlTextArea.prototype.tidyHTML = function () {
        var originalContent = this.divElement.innerHTML;
        var cleanContent = UI.TidyHTML(this.divElement.innerHTML);
        if (cleanContent != originalContent)
            this.divElement.innerHTML = cleanContent;
    };
    HtmlTextArea.prototype.updateContent = function (content) {
        //console.log('updating content', content);
        this.wrapLinks();
        this.tidyHTML();
        //content = Utils.ClearHTML(content);
        var textContent = this.htmlAsText(content);
        this.setState(function (state) { return (__assign({}, state, { content: content, textContent: textContent })); });
        if (this.state.onChange)
            this.state.onChange(content, textContent);
        $(window).trigger('taskrow:modalbodyresized');
    };
    HtmlTextArea.prototype.updateFormatActionState = function (action, active) {
        //console.log('updateFormatActionState ', action, active, this.state.activeFormatActions.indexOf(action) > -1);
        if ((this.state.activeFormatActions.indexOf(action) > -1) !== active) {
            this.setState(function (state) { return (__assign({}, state, { "activeFormatActions": state.activeFormatActions.filter(function (x) { return x != action; }).concat(active ? [action] : []).slice() })); });
        }
    };
    HtmlTextArea.prototype.execAction = function (event, action, value) {
        //console.log('exec action', action, this.stateControlledActions.indexOf(action) > -1, this.state.activeFormatActions.indexOf(action) > -1)
        document.execCommand(action, false, value);
        event.currentTarget.blur();
        this.divElement.focus();
        event.preventDefault();
        event.stopPropagation();
        if (this.stateControlledActions.indexOf(action) > -1)
            this.updateFormatActionState(action, this.state.activeFormatActions.indexOf(action) > -1);
        return false;
    };
    HtmlTextArea.prototype.parseSelection = function () {
        //console.log('should parse selection?');
        var selection;
        if (window.getSelection() /*&& (window.getSelection()).type == 'Range'*/)
            selection = window.getSelection().getRangeAt(0);
        else
            return false;
        //console.log('yeap!');
        var self = this;
        var startContainerTagName = selection.startContainer.tagName ? selection.startContainer.tagName : '';
        var parentNodeTagName = selection.startContainer.parentNode.tagName ? selection.startContainer.parentNode.tagName : '';
        if (startContainerTagName.toUpperCase() == "B" || parentNodeTagName.toUpperCase() == "B")
            this.updateFormatActionState("bold", true);
        else
            this.updateFormatActionState("bold", false);
        if (startContainerTagName.toUpperCase() == "LI" || parentNodeTagName.toUpperCase() == "LI" ||
            startContainerTagName.toUpperCase() == "OL" || parentNodeTagName.toUpperCase() == "OL")
            this.updateFormatActionState("insertOrderedList", true);
        else
            this.updateFormatActionState("insertOrderedList", false);
    };
    HtmlTextArea.prototype.isActionButtonActive = function (action) {
        return this.state.activeFormatActions.indexOf(action) > -1;
    };
    HtmlTextArea.prototype.componentDidMount = function () {
        if (this.divElement)
            this.triggerOnRenderHtmlElement(this.divElement);
    };
    HtmlTextArea.prototype.triggerOnRenderHtmlElement = function (element) {
        if (this.state.onRenderHtmlElement)
            this.state.onRenderHtmlElement(element);
    };
    HtmlTextArea.prototype.triggerOnPaste = function (ev) {
        if (this.state.onPaste) {
            this.state.onPaste(ev);
            setTimeout(function () { $(window).trigger('taskrow:modalbodyresized'); }, 100);
        }
    };
    HtmlTextArea.prototype.renderButtonsBar = function () {
        var _this = this;
        return React.createElement("div", { className: "btn-group bteditpost" },
            React.createElement("button", { type: "button", onClick: function (e) { return _this.execAction(e, "bold"); }, className: this.isActionButtonActive("bold") ? "btn active" : "btn", title: Resources.Commons.Bold },
                React.createElement("i", { className: "icon icon-bold" })),
            React.createElement("button", { type: "button", onClick: function (e) { return _this.execAction(e, "indent"); }, className: "btn", title: Resources.Commons.Indent },
                React.createElement("i", { className: "icon icon-indent icon-indent-right" })),
            React.createElement("button", { type: "button", onClick: function (e) { return _this.execAction(e, "outdent"); }, className: "btn", title: Resources.Commons.Outdent },
                React.createElement("i", { className: "icon icon-outdent icon-indent-left" })),
            React.createElement("button", { type: "button", onClick: function (e) { return _this.execAction(e, "insertOrderedList"); }, className: this.isActionButtonActive("insertOrderedList") ? "btn active" : "btn", title: Resources.Commons.InsertOrderedList },
                React.createElement("i", { className: "icon icon-list-ol" })),
            React.createElement("button", { type: "button", onClick: function (e) { return _this.execAction(e, "hiliteColor", "yellow"); }, className: "btn", title: Resources.Commons.HiliteColor },
                React.createElement("i", { className: "icon icon-pencil" })),
            React.createElement("button", { type: "button", onClick: function (e) { return _this.execAction(e, "removeFormat"); }, className: "btn", title: Resources.Commons.RemoveFormt },
                React.createElement("i", { className: "icon icon-eraser" })));
    };
    HtmlTextArea.prototype.render = function () {
        var _this = this;
        //console.log('rendering');
        var divStyle = this.getDefaultDivStyles();
        divStyle = __assign({}, divStyle, this.state.style, (this.state.divContentEditableProperties || {}).style);
        var divProperties = __assign({ "style": divStyle }, this.state.divContentEditableProperties, { id: this.state.id, contentEditable: true, 
            //defaultValue: this.state.content,
            //dangerouslySetInnerHTML: (this.state.content ? { __html: this.state.content } : undefined),
            onChange: function (e) { return _this.updateContent(_this.divElement.innerHTML); }, onBlur: function (e) { return _this.updateContent(_this.divElement.innerHTML); }, 
            //onPaste: e => this.updateContent(this.divElement.innerHTML),
            onPaste: function (e) { return _this.triggerOnPaste(e); }, onFocus: function (e) { return _this.parseSelection(); }, onSelect: function (e) { return _this.parseSelection(); } });
        var inputProperties = __assign({}, this.state.inputHiddenProperties, { name: this.state.name, "type": "hidden", "value": this.state.textContent });
        return React.createElement(React.Fragment, null,
            React.createElement("div", __assign({}, divProperties, { ref: function (e) { return _this.divElement = e; } })),
            this.renderButtonsBar(),
            React.createElement("input", __assign({}, inputProperties, { ref: function (e) { return _this.inputElement = e; } })));
    };
    return HtmlTextArea;
}(React.Component));
var CssFramework;
(function (CssFramework) {
    CssFramework[CssFramework["Bootstrap2"] = 0] = "Bootstrap2";
    CssFramework[CssFramework["Bootstrap3"] = 1] = "Bootstrap3";
})(CssFramework || (CssFramework = {}));
//interface DynFormViewerFieldProps {
//    field: DynForm.Field;
//    defaultValue?: any;
//}
//interface DynFormViewerFieldState {
//    field: DynForm.Field;
//    defaultValue?: any;
//}
//# sourceMappingURL=DynFormViewer.js.map