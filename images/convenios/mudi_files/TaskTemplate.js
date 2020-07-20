///<reference path="../../Main/App.ts"/>
///<reference path="TaskAttachments.ts"/>
///<reference path="TaskDetail.ts"/>
var TaskTemplate = /** @class */ (function () {
    //#region Constructor
    function TaskTemplate(scope) {
        this.scope = scope;
    }
    //#endregion
    //#region IModule members
    TaskTemplate.prototype.Setup = function (options) {
    };
    TaskTemplate.prototype.Action = function (options) {
        var self = this;
        var templateData = {};
        var requestData = this.GetRequestData();
        taskrow.FinishLoadModule();
        $.get('/Task/ListTemplates', requestData, function (data) {
            self.viewModel = new TaskTemplateListViewModel(data);
            taskrow.LoadTemplate('Templates/Task/TaskTemplate', function (template) {
                $('#main').html(template(templateData));
                ko.applyBindings(self.viewModel, $('#dashboard')[0]);
                var options = new EditViewOptions();
                options.onCancel = function () {
                    if (self.viewModel.SelectedTemplate() && !(self.viewModel.SelectedTemplate().TaskTemplateID() > 0)) {
                        self.viewModel.SelectedTemplate(undefined);
                    }
                };
                UI.SetupEditViewForm('#frmTemplate', options);
                self.SetupScroll();
                $(window).addListener('resize', self.SetupScroll);
            });
        });
        if (this.scope.JobNumber)
            Menu.LoadMenu(Menus.JobMenu($.extend({}, { Job: { UrlData: { ClientNickName: this.scope.ClientNickname, JobNumber: this.scope.JobNumber, "Type": "job" } } })));
        else if (this.scope.ClientNickname)
            Menu.LoadMenu(Menus.ClientMenu($.extend({}, { ClientHome: { ClientData: { UrlData: { ClientNickName: this.scope.ClientNickname, "Type": "client" } } } })));
        else
            Menu.LoadMenu(Menus.TaskMenu());
    };
    TaskTemplate.prototype.RefreshData = function (selected) {
        var self = this;
        var requestData = this.GetRequestData();
        taskrow.DisplayLoading();
        $.get('/Task/ListTemplates', requestData, function (data) {
            taskrow.HideLoading();
            self.viewModel.RefreshData(data);
            if (selected) {
                self.viewModel.SelectItem(selected.TaskItemTemplateID);
                $('#taskTemplateList ul li[taskitemtemplateid=' + selected.TaskItemTemplateID + ']').addClass('active');
            }
        });
    };
    TaskTemplate.prototype.CurrentSection = function () {
        return this.scope.JobNumber ? Section.Job : this.scope.ClientNickname ? Section.Client : Section.TaskCentral;
    };
    TaskTemplate.prototype.Unload = function () {
        $(window).unbind('resize', this.SetupScroll);
    };
    TaskTemplate.prototype.CurrentContext = function () {
        return [];
    };
    //#endregion IModule members
    //#region Aux Methods
    TaskTemplate.prototype.GetRequestData = function () {
        return {
            clientNickname: this.scope.ClientNickname,
            jobNumber: this.scope.JobNumber
        };
    };
    //#endregion
    //#region Part methods
    TaskTemplate.prototype.RemovePart = function (sIndex) {
        this.viewModel.SelectedTemplate().Parts.splice(parseInt(sIndex, 10), 1);
    };
    TaskTemplate.prototype.NewPart = function () {
        this.viewModel.SelectedTemplate().Parts.push(new TaskTemplatePart());
    };
    //#endregion Part methods
    //#region Template Methods
    TaskTemplate.prototype.SetupScroll = function () {
        if ($('#taskTemplateList').length > 0) {
            $('#taskTemplateList').height(window.innerHeight - $('#taskTemplateList')[0].offsetTop - 50);
            $('#taskTemplateList').jsScroll();
        }
    };
    TaskTemplate.prototype.ClearSelection = function () {
        $('#frmTemplate').attr('disabled', 'disabled');
        this.viewModel.SelectItem(-1);
        $('#taskTemplateList ul li').removeClass('active');
    };
    TaskTemplate.prototype.SelectTaskTemplate = function (taskItemTemplateID) {
        $('#frmTemplate').attr('disabled', 'disabled');
        this.viewModel.SelectItem(taskItemTemplateID);
        $('.template-list li').removeClass('active');
        $('.template-list li a[taskitemtemplateid=' + taskItemTemplateID + ']').parent().addClass('active');
    };
    TaskTemplate.prototype.ToggleInactiveTemplates = function () {
        if (this.viewModel.ResultTemplates.Filters()['InactiveFilter'])
            this.viewModel.ResultTemplates.RemoveFilter('InactiveFilter');
        else
            this.viewModel.ResultTemplates.AddFilter('InactiveFilter', 'Inactive', [false, null]);
    };
    TaskTemplate.prototype.NewTemplate = function () {
        $('#frmTemplate').removeAttr('disabled');
        var newTemplate = new TaskTemplateViewModel(null);
        newTemplate.Parts.push(new TaskTemplatePart());
        this.viewModel.Templates.push(newTemplate);
        this.viewModel.SelectedTemplate(newTemplate);
    };
    TaskTemplate.prototype.SaveCurrentTemplate = function () {
        taskrow.DisplayLoading();
        var currentTemplate = this.viewModel.SelectedTemplate();
        currentTemplate.UpdateContent();
        var data = currentTemplate.GetJSON();
        var requestData = this.GetRequestData();
        $.extend(data, requestData);
        var self = this;
        $.ajax({
            url: '/Task/SaveTemplate',
            type: 'POST',
            data: data,
            success: function (data) {
                if (data.Success == false) {
                    UI.Alert(data.Message);
                    return false;
                }
                self.ClearSelection();
                taskrow.HideLoading();
                self.RefreshData(data.Entity);
            },
            error: function (result) {
                taskrow.HideLoading();
            }
        });
    };
    TaskTemplate.prototype.CancelEditting = function () {
        if (this.viewModel.SelectedTemplate().TaskItemTemplateID() > 0) {
            $('#frmTemplate').attr('disabled', 'disabled');
            this.viewModel.SelectedTemplate().Reset();
        }
        else {
            this.ClearSelection();
            this.RefreshData();
        }
    };
    return TaskTemplate;
}());
var TaskTemplateListViewModel = /** @class */ (function () {
    function TaskTemplateListViewModel(data) {
        this.PartTypes = [{ ID: TaskTemplatePartType.SimpleText, Name: Resources.TaskTemplate.SimpleText }, { ID: TaskTemplatePartType.TextField, Name: Resources.TaskTemplate.TextField }];
        this.Templates = ko.observableArray([]);
        this.SelectedTemplate = ko.observable(undefined);
        this.ResultTemplates = new DataSource([]);
        this.ResultTemplates.FilteredData;
        this.ResultTemplates.SetOrder({ Title: false, Inactive: false });
        this.ResultTemplates.FilterTextColumns(['Title']);
        this.ResultTemplates.AddFilter('InactiveFilter', 'Inactive', [false, null]);
        this.RefreshData(data);
    }
    TaskTemplateListViewModel.prototype.RefreshData = function (data) {
        var finalData = _.map(data, function (item) {
            return new TaskTemplateViewModel(item);
        });
        this.Templates(finalData);
        this.ResultTemplates.RefreshData(ko.toJS(finalData));
    };
    TaskTemplateListViewModel.prototype.SelectItem = function (taskItemTemplateID) {
        var item = _.filter(this.Templates(), function (item) { return item.TaskItemTemplateID() == taskItemTemplateID; })[0];
        if (item) {
            if (item.Content.trim() == "")
                item.Parts.push(new TaskTemplatePart());
            this.SelectedTemplate(item);
            return true;
        }
        this.SelectedTemplate(undefined);
        return false;
    };
    return TaskTemplateListViewModel;
}());
var TaskTemplateViewModel = /** @class */ (function () {
    function TaskTemplateViewModel(data) {
        this.rxHeader = /\<!-- _lv:(\d+) --\>/gi;
        this.rxPart = /\<!-- _lp:(\d+),([^:]+): --\>/gi;
        this.rxPartEnd = /\<!-- _lpe --\>/gi;
        data = data || { Title: '', Content: '', TaskItemTemplateID: 0 };
        this.Parts = ko.observableArray([]);
        this.Title = ko.observable('');
        this.TaskItemTemplateID = ko.observable(0);
        this.Inactive = ko.observable(data.Inactive || false);
        this.Extranet = ko.observable(data.Extranet || false);
        if (data)
            this.RefreshData(data);
    }
    TaskTemplateViewModel.prototype.GetJSON = function () {
        return { TaskItemTemplateID: this.TaskItemTemplateID(), Title: this.Title(), Content: this.Content, Inactive: this.Inactive(), Extranet: this.Extranet() };
    };
    TaskTemplateViewModel.prototype.RefreshData = function (data) {
        this.Content = data.Content;
        this.Title(data.Title);
        this.IdentifyParts(data.Content);
        this.TaskItemTemplateID(data.TaskItemTemplateID);
        this.Inactive(data.Inactive || false);
        this.Extranet(data.Extranet || false);
        this.originalData = data;
    };
    TaskTemplateViewModel.prototype.Reset = function () {
        this.RefreshData(this.originalData);
    };
    TaskTemplateViewModel.prototype.GetContent = function () {
        this.UpdateContent();
        return this.Content;
    };
    TaskTemplateViewModel.prototype.IdentifyParts = function (content) {
        var index = -1;
        var length = content.length;
        var parts = [];
        this.rxHeader.lastIndex = undefined;
        var matchHeader = this.rxHeader.exec(content);
        if (!matchHeader)
            return;
        index = matchHeader.index + matchHeader[0].length - 1;
        while (index + 1 < length) {
            this.rxPart.lastIndex = index;
            var matchPart = this.rxPart.exec(content);
            if (!matchPart)
                break;
            index = matchPart.index + matchPart[0].length - 1;
            this.rxPartEnd.lastIndex = index;
            var matchPartEnd = this.rxPartEnd.exec(content);
            index = matchPartEnd.index + matchPartEnd[0].length - 1;
            var part;
            if (matchPart[1] == TaskTemplatePartType.SimpleText.toFixed()) {
                part = new TaskTemplatePart();
                part.PartType(TaskTemplatePartType.SimpleText);
                part.PartText(content.substring(matchPart.index + matchPart[0].length, matchPartEnd.index));
            }
            else if (matchPart[1] == TaskTemplatePartType.TextField.toFixed()) {
                part = new TaskTemplatePart();
                part.PartType(TaskTemplatePartType.TextField);
                part.PartLabel(matchPart[2]);
            }
            if (part)
                parts.push(part);
        }
        this.Parts(parts);
    };
    TaskTemplateViewModel.prototype.UpdateContent = function () {
        var parts = this.Parts();
        var retParts = [];
        retParts.push('<!-- _lv:1 -->');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].PartType() == TaskTemplatePartType.SimpleText) {
                retParts.push('<!-- _lp:' + TaskTemplatePartType.SimpleText + ',a: -->');
                retParts.push(parts[i].PartText());
                retParts.push('<!-- _lpe --> <br/> ');
            }
            else if (parts[i].PartType() == TaskTemplatePartType.TextField) {
                retParts.push('<!-- _lp:' + TaskTemplatePartType.TextField + ',' + parts[i].PartLabel().replace(/:/gi, '') + ': -->');
                retParts.push(parts[i].PartLabel());
                retParts.push("<br/>");
                retParts.push('<span class="editable">?</span>');
                retParts.push('<!-- _lpe --> <br/> ');
            }
        }
        this.Content = retParts.join('');
    };
    return TaskTemplateViewModel;
}());
var TaskTemplatePart = /** @class */ (function () {
    function TaskTemplatePart() {
        this.PartLabel = ko.observable('');
        this.PartText = ko.observable('');
        this.PartType = ko.observable(TaskTemplatePartType.SimpleText);
        var self = this;
        this.HasLabel = ko.computed(function () {
            return self.PartType() == TaskTemplatePartType.TextField;
        }, self);
        this.HasText = ko.computed(function () {
            return self.PartType() == TaskTemplatePartType.SimpleText;
        }, self);
    }
    return TaskTemplatePart;
}());
var TaskTemplateScope;
(function (TaskTemplateScope) {
    TaskTemplateScope[TaskTemplateScope["Company"] = 3] = "Company";
    TaskTemplateScope[TaskTemplateScope["Client"] = 1] = "Client";
    TaskTemplateScope[TaskTemplateScope["Job"] = 3] = "Job";
})(TaskTemplateScope || (TaskTemplateScope = {}));
define(function () {
    return TaskTemplate;
});
//# sourceMappingURL=TaskTemplate.js.map