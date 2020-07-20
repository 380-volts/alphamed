var DynForm;
(function (DynForm) {
    var FieldType;
    (function (FieldType) {
        FieldType[FieldType["TextBox"] = 1] = "TextBox";
        FieldType[FieldType["DropDown"] = 2] = "DropDown";
        FieldType[FieldType["TextArea"] = 3] = "TextArea";
        FieldType[FieldType["HtmlBox"] = 4] = "HtmlBox";
    })(FieldType = DynForm.FieldType || (DynForm.FieldType = {}));
    var TextBoxType;
    (function (TextBoxType) {
        TextBoxType[TextBoxType["Text"] = 1] = "Text";
        TextBoxType[TextBoxType["Integer"] = 2] = "Integer";
        TextBoxType[TextBoxType["Decimal"] = 3] = "Decimal";
        TextBoxType[TextBoxType["Date"] = 4] = "Date";
    })(TextBoxType = DynForm.TextBoxType || (DynForm.TextBoxType = {}));
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        Utils.fieldTypeName = function (fieldType) {
            switch (fieldType) {
                case FieldType.TextBox: return 'TextBox';
                case FieldType.DropDown: return 'DropDown';
                case FieldType.TextArea: return 'TextArea';
                case FieldType.HtmlBox: return 'Html';
                default: return '';
            }
        };
        Utils.textboxTypeName = function (textboxType) {
            switch (textboxType) {
                case TextBoxType.Text: return 'Text';
                case TextBoxType.Integer: return 'Integer';
                case TextBoxType.Decimal: return 'Float';
                case TextBoxType.Date: return 'Date';
                default: return '';
            }
        };
        return Utils;
    }());
    DynForm.Utils = Utils;
})(DynForm || (DynForm = {}));
//# sourceMappingURL=DynForm.js.map