///<reference path="../../Main/App.ts"/>
///<reference path="TaskAttachments.ts"/>
///<reference path="TaskDetail.ts"/>
var NewTask = /** @class */ (function () {
    function NewTask() {
        this.tagSelectorDisable = true;
        this.mentionedUsers = [];
        this.MembersToSearch = [];
        this.currentContextTags = new Array();
        this.currentFunctionGroupTags = new Array();
        this.effortUnitSelector = null;
        this.EffortUnitContent = null;
        this.newEffortUnitName = null;
        this.newEffortPopover = null;
    }
    NewTask.prototype.CurrentSection = function () {
        return Section.TaskCentral;
    };
    NewTask.prototype.CurrentContext = function () {
        return new Array();
    };
    NewTask.prototype.Setup = function (options) {
    };
    NewTask.prototype.Clear = function () {
        var self = this;
        self.viewModel.clearSelectedOwner();
        self.allocationControl.Reset();
        self.attachmentControl.Destroy();
        self.searchContext.Unload();
        self.ownerSearch.Unload();
        self.memberSearchUser.Unload();
        self.taskModal = null;
    };
    NewTask.prototype.Action = function (options) {
        var self = this;
        this.currentContext = taskrow.currentModule.CurrentContext();
        //Dados recebidos na chamada do modal
        var taskData = options.taskData;
        this.originalTaskData = taskData;
        if (taskData.clientID) {
            this.currentContext = [];
            this.currentContext.push(new BreadcrumbItem(taskData.clientNickname, URLs.BuildUrl({ ClientNickName: taskData.clientNickname }, 'client'), 'clientID', taskData.clientID));
            this.currentContext[0]['ClientNickName'] = taskData.clientNickname;
            if (taskData.jobID) {
                this.currentContext.push(new BreadcrumbItem(taskData.jobTitle, URLs.BuildUrl({ ClientNickName: taskData.clientNickname, JobNumber: taskData.jobNumber }, 'job'), 'jobID', taskData.jobID));
                this.currentContext[1]['JobNumber'] = taskData.jobNumber;
            }
        }
        else {
            var deliverableContext = _.findWhere(this.currentContext, { 'Name': 'deliverableID' });
            if (deliverableContext)
                this.currentContext.splice(_.indexOf(this.currentContext, deliverableContext), 1);
        }
        var modalOptions = new ModalWindowOptions();
        modalOptions.title = Resources.Task.NewTask;
        modalOptions.closeButton = true;
        modalOptions.onClose = function () {
            self.Clear();
            taskrow.modalCurrentModule = null;
            Tutorial.CloseTour(EnumTutorialType.NewTask);
            Utils.CleanNode($('#modal_newtask')[0]);
        };
        modalOptions.helpButton = true;
        modalOptions.onHelp = function () {
            Tutorial.ShowNewTaskTour();
        };
        var btnSave = new ModalButton();
        btnSave.id = 'btnSaveTask';
        btnSave.label = Resources.Commons.Save;
        btnSave.isPrimary = true;
        btnSave.cssClass = 'btn-save-task';
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.action = function (e) {
            var error = false;
            $('#btnSaveTask').button('loading');
            var frm = $('#frmSaveTask');
            if (!frm.valid())
                error = true;
            var invalidEffortEstimation = self.viewModel.EffortRequired() && (!self.viewModel.EffortEstimation() || self.viewModel.EffortEstimation() <= 0);
            self.viewModel.InvalidEffortEstimation(invalidEffortEstimation);
            if (invalidEffortEstimation)
                error = true;
            var invalidRequestType = (!self.viewModel.RequestTypeID() || self.viewModel.RequestTypeID() <= 0);
            self.viewModel.InvalidRequestType(invalidRequestType);
            if (invalidRequestType)
                error = true;
            var invalidDeliverable = self.viewModel.DeliverableRequired() && (!self.viewModel.DeliverableID() || self.viewModel.DeliverableID() <= 0);
            self.viewModel.InvalidDeliverable(invalidDeliverable);
            if (invalidDeliverable)
                error = true;
            $('#spnTagValidation').remove();
            var erroTags = false;
            var tags = self.currentContextTags.concat(self.currentFunctionGroupTags);
            if (_.any(tags, function (t) { return t.FromFunctionGroup == true; })) {
                var tagsByGroup = _.chain(tags).filter(function (x) { return x.FromFunctionGroup == true; }).groupBy(function (x) { return x.tagGroup; }).value();
                var selectedTags = self.viewModel.TaskTags();
                var anyGroupNotSelected = false;
                $.each(tagsByGroup, function (i, tg) {
                    var tagGroupSelected = _.any(selectedTags, function (stg) { return stg.tagGroup == tg[0].tagGroup; });
                    //console.log(['group', tg[0].tagGroup, 'tagGroupSelected', tagGroupSelected]);
                    anyGroupNotSelected = !tagGroupSelected;
                    if (anyGroupNotSelected)
                        return false;
                });
                //console.log(['anyGroupNotSelected', anyGroupNotSelected]);
                if (anyGroupNotSelected) {
                    var groupsLabel = '';
                    _.each(tagsByGroup, function (tg) {
                        groupsLabel += '<br/> - ' + tg[0].tagGroup;
                    });
                    $('<span class="field-validation-error" id="spnTagValidation" style="white-space: normal;"><span class="">É obrigatório selecionar ao menos uma tag de área para cada grupo: ' + groupsLabel + '</span></span>').appendTo($('#tasktagsContainer'));
                    error = erroTags = true;
                }
            }
            if (!erroTags && _.any(tags, function (t) { return t.FromClient == true; })) {
                var selectedTags = self.viewModel.TaskTags();
                if (!_.any(selectedTags, function (t) { return t.FromClient == true; })) {
                    $('<span class="field-validation-error" id="spnTagValidation" style="white-space: normal;><span class="">É obrigatório selecionar ao menos uma tag da empresa</span></span>').appendTo($('#tasktagsContainer'));
                    error = true;
                }
            }
            if (!erroTags && _.any(tags, function (t) { return t.FromJob == true; })) {
                var selectedTags = self.viewModel.TaskTags();
                if (!_.any(selectedTags, function (t) { return t.FromJob == true; })) {
                    $('<span class="field-validation-error" id="spnTagValidation" style="white-space: normal;><span class="">É obrigatório selecionar ao menos uma tag do projeto</span></span>').appendTo($('#tasktagsContainer'));
                    error = true;
                }
            }
            if (error) {
                $('#btnSaveTask').removeAttr('disabled').button('reset');
                var $errorMessages = $('#modal_newtask .field-validation-error, #modal_newtask .input-validation-error, #modal_newtask .field-message-error').filter(':visible');
                if ($errorMessages && $errorMessages.length > 0) {
                    var errorOffsetTop = Math.max($errorMessages.first().offset().top + $('.modal-body').scrollTop() - 125, 0);
                    $('.modal-body').animate({ scrollTop: errorOffsetTop }, 10);
                }
                return false;
            }
            if (self.viewModel.SelectedEffortEstimationType() != null)
                $('#modal_newtask #EffortUnitListString').val('');
            self.viewModel.TaskItemComment(Utils.ClearHTML(self.formatComment.GetContent(), 'format-content-'));
            setTimeout(function () {
                taskrow.DisplayLoading();
                frm.submit();
            }, 150);
        };
        modalOptions.buttons.push(btnSave);
        modalOptions.style = 'width: 1000px; background-color: #e8e8e8; top: 8%; left: 32%;';
        modalOptions.modalID = 'newTaskModal';
        modalOptions.minimizeButton = true;
        var templateData = {
            currentUserID: environmentData.currentUserID,
            currentUserLogin: environmentData.currentUser.UserLogin,
            currentUserSmallMask: environmentData.userMask.SmallRelativeURL + environmentData.currentUser.UserHashCode + '.jpg'
        };
        UI.ShowModal('Templates/Task/NewTask', templateData, modalOptions, function (Modal) {
            //carregar componentes de nova task - ps.: manter nessa ordem
            self.SetupSearchOwner(function () {
                $('#newTaskOwnerSearch input:last')[0].focus();
            });
            self.SetupSearchMembers();
            self.SetupSearchContext();
            self.SetupAllocationControl();
            self.SetupFormatComment();
            self.SetupAttachment();
            self.SetupTagSelector(self.tagSelectorDisable);
            self.viewModel = new NewTaskViewModel();
            self.SetupEffortEstimation();
            self.SetupContactList();
            self.SetupRequestType();
            //Selecionar Job, com base no contexto atual
            var _context = taskrow.currentModule.CurrentContext();
            for (var i = 0; i < _context.length; i++) {
                if (_context[i].Name == 'jobID')
                    self.SetupSelectedJobContext(_context[i].Value);
                if (_context[i].Name == 'clientID')
                    self.RefreshContactList(_context[i].Value);
            }
            ko.applyBindings(self.viewModel, $('#modal_newtask')[0]);
            self.SetupOriginalTaskData();
            //adiciona scroll automaticamente quando necessario, no FormatConetnt.ts -> ElementOnChange
            //(<any>$('#postNewTask')).jsScroll();
            Utils.SetupValidation($('#frmSaveTask')[0]);
            self.taskModal = Modal;
            //iniciar tour new task
            Tutorial.AutoNewTaskTour();
        });
    };
    NewTask.prototype.SetupRequestType = function () {
        var self = this;
        self.RefreshRequestTypeListData();
        $("select#RequestTypeID").off('task:applytemplate').on('task:applytemplate', function (e, requestTypeID) {
            var requestType = _.filter(self.viewModel.RequestTypeList(), function (x) { return x.RequestTypeID == requestTypeID; })[0];
            var dynFormMetadata = self.viewModel.RequestTypeForm();
            if (requestType && requestType.Content && requestType.Content.length > 0 && !dynFormMetadata)
                self.formatComment.ApplyTemplate(requestType.Content, false);
            if (dynFormMetadata) {
                var dynFormContainer = $("#newTaskDynFormContainer")[0];
                self.dynForm.Init(dynFormContainer, dynFormMetadata, 'dynForm', false, requestType.DynFormHint);
            }
            else
                self.dynForm.Reset();
        });
    };
    NewTask.prototype.SetupSelectedJobContext = function (jobID, callback) {
        var self = this;
        $.get('/Job/GetJobInfoByJobID?jobID=' + jobID, function (item) {
            if (item.JobNumber) {
                self.viewModel.ClientID(item.ClientID);
                self.viewModel.ClientNickName(item.ClientNickName);
                self.viewModel.JobNumber(item.JobNumber);
                self.viewModel.JobID(item.JobID);
                self.viewModel.TagContextID(item.TagContextID);
                self.viewModel.EffortRequired(item.EffortRequired);
                self.viewModel.DeliverableRequired(item.DeliverableRequired);
                //self.viewModel.TemplateRequired(item.TemplateRequired);
                //self.RefreshTemplatesList(item.ClientNickName, item.JobNumber);
                self.RefreshRequestTypeListData();
                self.ReloadJobDependencies(item.JobID);
                self.ReloadEffortEstimationControl();
                if (callback)
                    callback();
            }
        });
    };
    NewTask.prototype.SetupContactList = function () {
        var self = this;
        $('.contact-list').click(function (e) {
            var div = $(this);
            if (div.hasClass('open')) {
                var target = $(e.target);
                if (target.is('li')) {
                    //console.log(target.val());
                    self.viewModel.RequestContactID(target.val());
                }
                return;
            }
            div.addClass('open');
            setTimeout(function () {
                $(document).one('click', function () {
                    div.removeClass('open');
                });
            }, 0);
        });
    };
    NewTask.prototype.SetupOriginalTaskData = function () {
        var self = this;
        var taskData = self.originalTaskData;
        if (!taskData)
            return;
        if (taskData.title) {
            self.viewModel.TaskTitle(taskData.title);
        }
        if (taskData.clientID) {
            self.viewModel.ClientID(taskData.clientID);
            self.viewModel.ClientNickName(taskData.clientNickname);
            if (taskData.jobID) {
                self.viewModel.JobNumber(taskData.jobNumber);
                self.viewModel.JobID(taskData.jobID);
                //self.RefreshTemplatesList(taskData.clientNickname, taskData.jobNumber);
                self.RefreshRequestTypeListData();
                self.RefreshContactList(taskData.clientID);
                $('#searchContextBox').trigger('taskrow:selectedClientAndJob');
            }
        }
        if (taskData.ownerUserID) {
            setTimeout(function (self) {
                taskrow.ListUsers(function (users) {
                    var owner = _(users).where({ UserID: self.originalTaskData.ownerUserID })[0];
                    self.ownerSearch.selectUserCallback.apply(self, [owner]);
                });
            }, 0, self);
        }
        if (taskData.dueDate) {
            //console.log(self.originalTaskData.dueDate);
            setTimeout(function (self) {
                self.allocationControl.SelectDate(self.originalTaskData.dueDate);
            }, 3000, self);
        }
        if (taskData.userAllocationID) {
            self.viewModel.UserAllocationID(taskData.userAllocationID);
        }
    };
    NewTask.prototype.Unload = function () {
        if (this.searchContext)
            this.searchContext.Unload();
        if (this.attachmentControl)
            this.attachmentControl.Destroy();
    };
    NewTask.prototype.ClearClientJobContext = function () {
        var self = this;
        self.viewModel.ClientID(null);
        self.viewModel.ClientNickName('');
        self.viewModel.JobID(null);
        self.viewModel.JobNumber(null);
        self.viewModel.DeliverableID(null);
        self.viewModel.TagContextID(null);
        self.viewModel.EffortRequired(false);
        self.viewModel.DeliverableRequired(false);
        self.viewModel.TemplateRequired(false);
        self.ReloadJobDependencies(null);
        self.ReloadEffortEstimationControl();
        $('#frmSaveTask')[0].validator.element('#JobID');
    };
    NewTask.prototype.RemoveSelectedOwner = function () {
        var self = this;
        self.viewModel.clearSelectedOwner();
        self.allocationControl.Reset();
        self.ownerSearch.Reset();
        self.ReloadUserFunctionGroupTags();
        self.RefreshRequestTypeListData();
    };
    NewTask.prototype.SelectDueDate = function (date) {
        this.viewModel.DueDate(date);
        if (date) {
            $('#frmSaveTask')[0].validator.element('#DueDate');
            $('#newtaskDueDateSelector').trigger('taskrow:selectedDueDate');
        }
    };
    NewTask.prototype.SetupAttachment = function () {
        var self = this;
        require(['Scripts/ClientViews/Task/TaskAttachments'], function (attachments) {
            var $element = $('#postNewTask');
            self.attachmentControl = new TaskAttachments($element[0], $('#newTaskAddAttachments')[0], $('#newTaskAttachmentsList')[0], $('#btnSaveTask')[0]);
            self.attachmentControl.GoogleEnabled = ($.inArray(environmentData.ExternalServices.GoogleDrive, $.map(environmentData.CurrentUserExternalServices, function (s) { return s.ExternalServiceID; })) > -1);
            self.attachmentControl.addAttachmentCallback = function () {
                var count = $(self.attachmentControl.dropAreaElement).dropArea('Count');
                self.viewModel.CountAttachments(count);
                $(window).trigger('taskrow:modalbodyresized');
            };
            self.attachmentControl.deleteAttachmentCallback = function () {
                var count = $(self.attachmentControl.dropAreaElement).dropArea('Count');
                self.viewModel.CountAttachments(count);
                $(window).trigger('taskrow:modalbodyresized');
            };
            self.attachmentControl.Init();
            $('#editButtonsContainer #btnAddAttachment').unbind().addListener('click', function (e) {
                self.attachmentControl.AddSingleFile();
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
            $('#editButtonsContainer #btnAddGoogleDriveFile').unbind().addListener('click', function (e) {
                self.attachmentControl.AddGoogleDrive();
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
        });
    };
    NewTask.prototype.SetupAllocationControl = function () {
        var self = this;
        self.allocationControl = new AllocationControl();
        self.allocationControl.Init($('#newtaskDueDateSelector')[0], //container
        3, //max task visible in day
        function (date) {
            self.SelectDueDate.apply(self, [date]);
        } //selectDate callback
        );
    };
    NewTask.prototype.SetupSearchContext = function () {
        var self = this;
        var context = this.currentContext;
        var searchContextBox = $('#searchContextBox')[0];
        this.searchContext = new ContextSearch(searchContextBox, context, ContextSearchMode.Selection, Resources.Task.SearchClientAndJob);
        this.searchContext.searchTasks = false;
        this.searchContext.showInactives = false;
        this.searchContext.selectItemCallback = function (item) {
            if (item.ClientID && item.ClientID > 0 && item.ClientID != self.viewModel.ClientID()) {
                self.viewModel.ClientID(item.ClientID);
                self.viewModel.ClientNickName(item.ClientNickName);
                self.RefreshContactList(item.ClientID);
                $('#frmSaveTask')[0].validator.element('#JobID');
            }
            if (item.JobID && item.JobID > 0 && item.JobID != self.viewModel.JobID()) {
                self.viewModel.JobNumber(item.JobNumber);
                self.viewModel.JobID(item.JobID);
                //self.RefreshTemplatesList(item.ClientNickName, item.JobNumber);
                self.RefreshRequestTypeListData();
                $('#searchContextBox').trigger('taskrow:selectedClientAndJob');
                $('#frmSaveTask')[0].validator.element('#JobID');
                self.SetupSelectedJobContext(item.JobID);
            }
            if (item.DeliverableID && item.DeliverableID > 0) {
                self.viewModel.DeliverableID(item.DeliverableID);
            }
        };
        this.searchContext.deleteItemCallback = function (context) {
            self.ClearClientJobContext();
            for (var i = 0; i < context.length; i++) {
                var item = context[i];
                if (item.Name == "clientID")
                    self.viewModel.ClientID(item.Value);
                else if (item.Name == "jobID") {
                    self.viewModel.JobID(item.Value);
                }
                else if (item.Name == "deliverableID") {
                    self.viewModel.DeliverableID(item.Value);
                }
            }
            $('#frmSaveTask')[0].validator.element('#JobID');
        };
        this.searchContext.resetContextCallback = function (context) {
            self.ClearClientJobContext();
        };
        this.searchContext.Init();
    };
    NewTask.prototype.RefreshTemplatesList = function (clientNickname, jobNumber) {
        var data = { clientNickname: clientNickname, jobNumber: jobNumber };
        var self = this;
        $.get('/Task/ListTemplatesForTaskCreation', data, function (result) {
            $('#requestContactPhrase').css("top", result && result.length > 0 ? '2.7em' : '');
            if (result.length == 0)
                self.viewModel.TemplateRequired(false);
            self.formatComment.AddTemplateList(result, self.viewModel.TemplateRequired());
        });
    };
    NewTask.prototype.RefreshRequestTypeListData = function () {
        var self = this;
        var clientNickName = self.viewModel.ClientNickName();
        var jobNumber = self.viewModel.JobNumber();
        var ownerUserID = self.viewModel.Owner().UserID();
        var data = { clientNickName: clientNickName, jobNumber: jobNumber, ownerUserID: ownerUserID };
        var previousRequestTypeID = self.viewModel.RequestTypeID();
        $.get('/Task/ListRequestTypeForTask', data, function (result) {
            var _getContextNameFn = function (item) {
                var contextName = '';
                if (item.Context == EnumRequestTypeContext.FunctionGroup)
                    contextName = [Resources.RequestType.FromFunctionGroup, item.FunctionGroupName].join(': ');
                if (item.Context == EnumRequestTypeContext.Job)
                    contextName = Resources.RequestType.FromJob;
                if (item.Context == EnumRequestTypeContext.Client)
                    contextName = Resources.RequestType.FromClient;
                if (item.Context == EnumRequestTypeContext.Company)
                    contextName = Resources.RequestType.General;
                return [Resources.RequestType.RequestTypeList, contextName].join(' ');
            };
            var requestTypeList = _.any(result, function (x) { return x.InitialType == true; }) ?
                _.filter(result, function (x) { return x.InitialType == true; }) : result;
            var contextRequestTypeList = _.chain(requestTypeList)
                .groupBy(function (x) { return x.Context; })
                .map(function (x) {
                return {
                    Context: x[0].Context,
                    ContextName: _getContextNameFn(x[0]),
                    List: _.sortBy(x, function (x1) { return x1.DisplayName; })
                };
            })
                .sortBy(function (x) { return x.Context; })
                .value()
                .reverse();
            self.viewModel.RequestTypeList(requestTypeList);
            self.viewModel.ContextRequestTypeList(contextRequestTypeList);
            var existsPreviousRequestType = _.any(result, function (x) { return x.RequestTypeID == previousRequestTypeID; });
            //busca o tipo de solicitação padrao a partir do contexto mais especifico, na ordem: projeto > empresa > company
            var requestDefault = _.filter(result, function (x) { return x.IsDefault == true && x.JobID > 0; })[0];
            if (!requestDefault)
                requestDefault = _.filter(result, function (x) { return x.IsDefault == true && x.JobID == null && x.ClientID > 0; })[0];
            if (!requestDefault)
                requestDefault = _.filter(result, function (x) { return x.IsDefault == true && x.JobID == null && x.ClientID == null; })[0];
            if (existsPreviousRequestType) {
                self.viewModel.RequestTypeID(previousRequestTypeID);
                self.viewModel.RequestTypeID.valueHasMutated();
            }
            else if (requestDefault) {
                if (requestDefault.RequestTypeID > 0 && requestDefault.RequestTypeID != previousRequestTypeID) {
                    self.viewModel.RequestTypeID(requestDefault.RequestTypeID);
                    self.viewModel.RequestTypeID.valueHasMutated();
                }
            }
            else {
                self.viewModel.RequestTypeID(null);
                self.viewModel.RequestTypeID.valueHasMutated();
            }
        });
    };
    NewTask.prototype.RefreshContactList = function (clientID) {
        var self = this;
        self.viewModel.RequestContacts([]);
        $.get('/Client/ListClientContacts', { clientID: clientID }, function (result) {
            self.viewModel.RequestContacts(result);
            if (self.viewModel.RequestContactID() && _(result).where({ ClientContactID: self.viewModel.RequestContactID() }).length == 0)
                self.viewModel.RequestContactID(null);
        });
    };
    NewTask.prototype.SetupSearchOwner = function (callback) {
        var self = this;
        var _getMembers = function (group) {
            self.MembersToSearch = self.MembersToSearch.concat(_.clone(group.Members));
            $.each(group.Groups, function (i, g) {
                _getMembers(g);
            });
        };
        var _setupComponent = function (onlyHierarchyGroupsMembers) {
            self.ownerSearch = new SearchUser({
                searchBox: $('#newTaskOwnerSearch')[0],
                mode: SearchUserMode.Unique,
                renderUsers: false,
                initialUsers: [],
                placeholder: Resources.Task.SelectOwner,
                showUserIcon: true,
                usersToSearch: (onlyHierarchyGroupsMembers ? self.MembersToSearch : null)
            });
            self.ownerSearch.selectUserCallback = function (user) {
                self.SelectOwnerUser.apply(self, [user]);
            };
            self.ownerSearch.Init();
            if (callback)
                callback();
        };
        var viewAllGroupsPermission = _.indexOf(environmentData.CompanyPermissions, EnumCompanyPermissions.ViewAllGroups) > -1;
        var createTaskToAllGroups = _.indexOf(environmentData.JobPermissions, EnumJobPermissions.CreateTasksForAllGroups) > -1;
        if (!viewAllGroupsPermission && !createTaskToAllGroups) {
            $.get('/Task/CreateTaskGroupsPermission', {}, function (data) {
                var onlyHierarchyGroupsMembers = !data.CreateTasksForAllGroupsPermission && !data.ViewAllGroupsPermission;
                if (onlyHierarchyGroupsMembers)
                    for (var i = 0; i < data.HierarchyGroups.length; i++) {
                        _getMembers(data.HierarchyGroups[i]);
                    }
                _setupComponent(onlyHierarchyGroupsMembers);
            });
        }
        else {
            _setupComponent(false);
        }
    };
    NewTask.prototype.SelectOwnerUser = function (user) {
        var self = this;
        self.viewModel.Owner(new UserViewModel(user));
        self.allocationControl.viewModel.SelectOwner(user.UserID, null, function () {
            $('#newTaskOwnerContainer').trigger('taskrow:selectedUser');
            $(window).trigger('taskrow:modalbodyresized');
        });
        self.ReloadUserFunctionGroupTags(user.UserID);
        self.RefreshRequestTypeListData();
        $('#frmSaveTask')[0].validator.element('#frmSaveTask #OwnerUserID');
        $('#frmSaveTask')[0].clear(null, 'EffortEstimation');
    };
    NewTask.prototype.SetupSearchMembers = function () {
        var self = this;
        var selectMember = function (user) {
            var self = this;
            if ($.inArray(user.UserID, self.viewModel.TaskMembers()) == -1) {
                self.viewModel.TaskMembers.push(user.UserID);
                $("#modal_newtask #MemberListString").val(ko.utils.arrayGetDistinctValues(self.viewModel.TaskMembers()).toString());
            }
        };
        var deleteMember = function (users) {
            self.viewModel.TaskMembers($.map(users, function (u) { return u.UserID; }));
            $("#modal_newtask #MemberListString").val(ko.utils.arrayGetDistinctValues(self.viewModel.TaskMembers()).toString());
        };
        self.memberSearchUser = new SearchUser({
            searchBox: $('#newtaskMemberSearchBox')[0],
            mode: SearchUserMode.Multiple,
            renderUsers: true,
            initialUsers: [],
            placeholder: Resources.Task.Members
        });
        self.memberSearchUser.selectUserCallback = function (user) { selectMember.apply(self, [user]); };
        self.memberSearchUser.deleteUserCallback = function (user) { deleteMember.apply(self, [user]); };
        self.memberSearchUser.Init();
    };
    NewTask.prototype.SetupTagSelector = function (disabledMode) {
        var self = this;
        var onSelection = function (selection) {
            var taglist = $.map(selection, function (t) { return t.id + '|' + (t.colorID || ''); });
            self.viewModel.TaskTags(selection);
            $("#modal_newtask #TagListString").val(taglist.toString());
            $('#spnTagValidation').remove();
        };
        var tagRendererFn = function (data) {
            var colorCss = 'badge-color' + (data.colorID > 0 ? data.colorID : '');
            var tagGroup = data.tagGroup && data.tagGroup.length > 0 ? '[' + data.tagGroup + ']' : '';
            return tagGroup + ' <span class="tag ' + colorCss + '">' + data.name + '</span>';
        };
        this.tagSelector = new TagSelector($("#txtTaskTags")[0], {
            placeholder: Resources.Task.AddTag,
            disabledMode: disabledMode,
            orderField: 'displayName',
            groupBy: 'Context',
            renderer: tagRendererFn,
            selectionItemClass: function (data) {
                return 'badge-color' + (data.colorID > 0 ? data.colorID : '');
            }
        });
        this.tagSelector.selectionchangeCallback = onSelection;
        this.tagSelector.Init();
        this.restrictedTagSelector = new TagSelector($("#txtRestrictedTaskTags")[0], {
            placeholder: Resources.Task.AddTag,
            disabledMode: disabledMode,
            allowFreeEntries: false,
            orderField: 'displayName',
            renderer: tagRendererFn,
            selectionItemClass: function (data) {
                return 'badge-color' + (data.colorID > 0 ? data.colorID : '');
            }
        });
        this.restrictedTagSelector.selectionchangeCallback = onSelection;
        this.restrictedTagSelector.Init();
    };
    NewTask.prototype.ReloadTaskComment = function () {
        //console.log(['NewTask.ts - ReloadTaskComment']);
        var self = this;
        setTimeout(function () {
            $('*[data-bind]', "#postNewTask").each(function (index, item) {
                $(item).removeAttr('data-bind');
            });
            var taskComment = self.formatComment.GetContent();
            taskComment = Utils.ClearHTML(taskComment, 'format-content-');
            self.viewModel.TaskItemComment(taskComment);
        }, 100);
    };
    NewTask.prototype.SetupFormatComment = function () {
        var _this = this;
        var self = this;
        var contentEditable = $("#postNewTask")[0];
        var dynFormContainer = $("#newTaskDynFormContainer")[0];
        var buttonsContainer = $("#editButtonsContainer")[0];
        //formatComment
        this.formatComment = new FormatContent(contentEditable, buttonsContainer);
        this.formatComment.mentionsEnabled = true;
        this.formatComment.changeValueCallback = function (value) {
            self.ReloadTaskComment();
        };
        this.formatComment.changeUsersCallback = function (value) {
            var currentMembers = self.viewModel.TaskMembers();
            var pastMentionedUsers = self.mentionedUsers;
            //console.log('refresh', value, currentMembers, pastMentionedUsers);
            taskrow.ListUsers(function (users) {
                //Remove usuários que SÓ foram incorporados à lista de membros por terem sido marcados
                for (var i = currentMembers.length - 1; i >= 0; i--) {
                    if (_(pastMentionedUsers).contains(currentMembers[i]))
                        currentMembers.splice(i, 1);
                }
                var currentlyMentionedUsers = _(Array.prototype.splice.apply(value, [0])).clone();
                //Remove da lista "de usuários que seriam incorporados SÓ por terem sido marcados" aqueles que já aparecem como membros
                for (var i = currentlyMentionedUsers.length - 1; i >= 0; i--) {
                    if (_(currentMembers).contains(currentlyMentionedUsers[i])) {
                        currentlyMentionedUsers.splice(i, 1);
                    }
                }
                //Adiciona como membros tais usuários
                for (var i = 0; i < currentlyMentionedUsers.length; i++) {
                    currentMembers.push(currentlyMentionedUsers[i]);
                }
                self.mentionedUsers = currentlyMentionedUsers;
                self.viewModel.TaskMembers(currentMembers);
                $("#modal_newtask #MemberListString").val(currentMembers.join(','));
                self.memberSearchUser.SetSelectedUsers(currentMembers.map(function (id) { return _(users).find(function (x) { return x.UserID == id; }); }));
            });
        };
        this.formatComment.Init();
        //dynform
        this.dynForm = new DynFormViewer();
        this.dynForm.onChange = function (formHtml, fieldValues) {
            contentEditable.innerHTML = formHtml;
            _this.viewModel.TaskItemComment(formHtml);
        };
        this.dynForm.onRenderHtmlElement = function (element) { };
        this.dynForm.onPaste = function (ev) { self.attachmentControl.OnPaste(ev); };
        this.dynForm.onDrop = function (ev) { self.attachmentControl.OnDrop(ev); };
    };
    NewTask.prototype.ReloadEffortEstimationControl = function () {
        var self = this;
        //contexto estimativa esforço 
        if (self.viewModel.EffortRequired()) {
            if (!$('#modal_newtask #effortEstimationContainer').hasClass('expanded'))
                self.ToggleEffortContainer();
            if (self.viewModel.SelectedEffortEstimationType() != null)
                self.ShowEffortUnit();
        }
    };
    NewTask.prototype.DisableTagSelector = function () {
        if (this.restrictedTagSelector) {
            this.restrictedTagSelector.SetData(new Array());
            this.restrictedTagSelector.Clear();
            this.restrictedTagSelector.Disable();
        }
        if (this.tagSelector) {
            this.tagSelector.SetData(new Array());
            this.tagSelector.Clear();
            this.tagSelector.Disable();
        }
        this.tagSelectorDisable = true;
    };
    NewTask.prototype.ReloadTagSelector = function () {
        var self = this;
        $('#spnTagValidation').remove();
        if ((!self.viewModel.Owner() || !self.viewModel.Owner().UserID()) && !(self.viewModel.JobID() > 0)) {
            this.DisableTagSelector();
            return;
        }
        self.restrictedTagSelector.SetData(new Array());
        self.restrictedTagSelector.Clear();
        self.tagSelector.SetData(new Array());
        self.tagSelector.Clear();
        var allTags = [];
        if (self.viewModel.Owner().UserID() > 0 && self.currentFunctionGroupTags && self.currentFunctionGroupTags.length > 0) {
            allTags = allTags.concat(self.currentFunctionGroupTags);
            if (self.viewModel.TagContextID() != EnumTagContext.Open)
                allTags = allTags.concat(self.currentContextTags);
        }
        else
            allTags = allTags.concat(self.currentContextTags);
        //console.log(['currentContextTags', self.currentContextTags, 'currentFunctionGroupTags', self.currentFunctionGroupTags, 'allTags', allTags]);
        if (self.tagSelector) {
            $('#tagsContainer').removeClass('hide-container');
            $('#restrictedTagsContainer').addClass('hide-container');
            allTags = _.sortBy(allTags, function (x) { return x['Context']; });
            self.tagSelector.SetData(allTags);
            self.tagSelector.Enable();
        }
        else
            self.tagSelectorDisable = false;
    };
    NewTask.prototype.ReloadJobDependencies = function (jobID) {
        var self = this;
        if (jobID != null && jobID > 0) {
            //busca tags do job para autocomplete
            $.get('/Task/ListTaskTagsByJob/', { 'jobID': jobID }, function (data) {
                if (data.Success) {
                    var tags = new Array();
                    for (var i = 0; i < data.Entity.length; i++) {
                        var tag = data.Entity[i];
                        var tagItem = new TagItem(tag.TagTitle, true, tag.TagKey, tag.DisplayName, tag.ColorID, tag.TagGroup);
                        tagItem['Context'] = tag.Context;
                        tagItem['FromJob'] = tag.FromJob;
                        tagItem['FromClient'] = tag.FromClient;
                        tagItem['FromCompany'] = tag.FromCompany;
                        tags.push(tagItem);
                    }
                    self.currentContextTags.length = 0;
                    self.currentContextTags = tags;
                    self.ReloadTagSelector();
                }
            });
        }
        else {
            self.currentContextTags.length = 0;
            self.ReloadTagSelector();
        }
    };
    NewTask.prototype.ReloadUserFunctionGroupTags = function (userID) {
        var self = this;
        if (userID != null && userID > 0) {
            //busca tags da área do usuario selecionado para autocomplete
            $.get('/Task/ListTagsByFunctionGroup/', { 'userID': userID }, function (data) {
                if (data.Success) {
                    var tags = new Array();
                    for (var i = 0; i < data.Entity.length; i++) {
                        var tag = data.Entity[i];
                        var tagItem = new TagItem(tag.TagTitle, true, tag.TagKey, tag.DisplayName, tag.ColorID, tag.TagGroup);
                        tagItem['FromFunctionGroup'] = true;
                        tagItem['Context'] = Resources.UserFunction.UserFunctionGroup;
                        tags.push(tagItem);
                    }
                    self.currentFunctionGroupTags.length = 0;
                    self.currentFunctionGroupTags = tags;
                    self.ReloadTagSelector();
                }
            });
        }
        else {
            self.currentFunctionGroupTags.length = 0;
            self.ReloadTagSelector();
        }
    };
    NewTask.prototype.SaveTask_OnSuccess = function (data) {
        if (!data.Success) {
            taskrow.HideLoading();
            $('#btnSaveTask').button('reset');
            UI.Alert(data.Message);
            return;
        }
        taskrow.modalCurrentModule.taskModal.close();
        taskrow.modalCurrentModule = null;
        taskrow.HideLoading();
        $('#btnSaveTask').button('reset');
        if (taskrow.currentModule['constructor']['name'] == 'JobHome' && taskrow.currentModule['serverData'].Job.JobID == data.Entity.JobID) {
            taskrow.currentModule['avoidCache'] = true;
            taskrow.currentModule['ClearTaskFilters']();
            taskrow.currentModule['RefreshData']();
        }
        HeaderTimesheet.LoadTimesheetDayData();
    };
    NewTask.prototype.SetupEffortEstimation = function () {
        this.SetupEffortUnitTemplate();
        this.SetupEffortUnitPopover();
        var self = this;
        this.effortTimepicker = $('#modal_newtask input#txtEffortEstimationTimepicker').timesheetpicker({
            openStart: true,
            keepEditMode: true,
            setTimecallback: function (time) {
                self.viewModel.EffortUnitListString('');
                self.viewModel.EffortEstimation(time);
            }
        });
        var effortUnitList = self.GetAvailableEffortUnitList();
        this.effortUnitSelector = new TagSelector($("#txtSearchEffortUnit")[0], { placeholder: Resources.Task.AddEffortUnit, contextTags: effortUnitList, useTabKey: false });
        this.effortUnitSelector.selectionchangeCallback = function (selection) {
            if (selection && selection.length > 0) {
                var effortUnitID = selection[0].id;
                var effortUnit = _.findWhere(environmentData.EffortUnitList, { 'EffortUnitID': effortUnitID });
                if (effortUnit) {
                    var model = new EffortUnitViewModel(effortUnit);
                    self.viewModel.EffortUnit.push(model);
                }
                else {
                    self.newEffortUnitName = selection[0].name;
                    if (self.newEffortPopover)
                        self.newEffortPopover.popover('show');
                }
                self.ResetSearchEffortUnit();
            }
        };
        this.effortUnitSelector.Init();
        $('#modal_newtask #postNewTask').focusin(function (e) {
            if ($('#modal_newtask #effortEstimationContainer').hasClass('expanded'))
                self.ToggleEffortContainer();
        });
    };
    NewTask.prototype.ToggleEffortTimepicker = function (mode) {
        var beforeMode = this.viewModel.SelectedEffortEstimationType();
        this.viewModel.SelectedEffortEstimationType(mode);
        var $effortContainer = $('#modal_newtask #effortEstimationContainer');
        $effortContainer.removeClass('effort-unit');
        if (this.newEffortPopover)
            this.newEffortPopover.popover('hide');
        if (this.effortTimepicker != null && this.effortTimepicker[0].attr.mode != mode) {
            this.effortTimepicker.timesheetpicker('changeMode', mode);
        }
        if (beforeMode != mode) {
            this.viewModel.EffortEstimation(0);
            //se antes era por unidade, remove todos e reseta
            if (!beforeMode) {
                this.viewModel.EffortUnit.removeAll();
                this.ResetSearchEffortUnit();
            }
        }
    };
    NewTask.prototype.ToggleEffortContainer = function () {
        var $effortContainer = $('#modal_newtask #effortEstimationContainer');
        $effortContainer.toggleClass('expanded');
        if ($effortContainer.hasClass('expanded')) {
            if (this.effortTimepicker != null)
                this.effortTimepicker.timesheetpicker('reset');
        }
        else {
            this.effortUnitSelector.instance.collapse(true);
            this.effortUnitSelector.instance.empty();
            if (this.newEffortPopover) {
                this.newEffortPopover.popover('hide');
            }
        }
    };
    NewTask.prototype.ShowEffortUnit = function () {
        this.viewModel.EffortEstimation(0);
        this.viewModel.SelectedEffortEstimationType(null);
        var $effortContainer = $('#modal_newtask #effortEstimationContainer');
        $effortContainer.addClass('effort-unit');
        if (environmentData.EffortUnitList.length == 0 && this.newEffortPopover)
            this.newEffortPopover.popover('show');
    };
    NewTask.prototype.ValidateEffortUnit = function () {
        var $effortContianer = $('#popover_effortunit');
        var unitName = $('#UnitName', $effortContianer).val();
        var effort = $('#Effort', $effortContianer).val();
        var valid = unitName != '' && effort > 0;
        if (valid)
            $('#txtEffortUnitMessage').hide();
        else
            $('#txtEffortUnitMessage').text(Resources.Task.EffortFieldsRequired).show();
        return valid;
    };
    NewTask.prototype.SaveEffortUnit = function () {
        var self = this;
        var $btn = $('#btnSaveEffortUnit');
        var $effortContianer = $('#popover_effortunit');
        var unitName = $('#UnitName', $effortContianer).val();
        var effort = $('#Effort', $effortContianer).val();
        var $frm = $('#frmSaveEffortUnit');
        if (!this.ValidateEffortUnit()) {
            $btn.removeAttr('disabled');
            return false;
        }
        $('#txtEffortUnitMessage').text('').hide();
        $btn.button('loading');
        taskrow.DisplayLoading();
        var effortUnit = {
            EffortUnitID: 0,
            UnitName: unitName,
            Effort: effort
        };
        $.ajax({
            url: 'Task/SaveEffortUnit',
            data: Utils.ToParams({ effortUnit: effortUnit }),
            success: function (data) {
                taskrow.HideLoading();
                $btn.button('reset');
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    return false;
                }
                var effortUnit = data.Entity;
                var indexOf = _.indexOf(_.pluck(environmentData.EffortUnitList, 'EffortUnitID'), effortUnit.EffortUnitID);
                if (indexOf > -1)
                    environmentData.EffortUnitList.splice(indexOf, 1, effortUnit);
                else {
                    environmentData.EffortUnitList.push(effortUnit);
                    environmentData.EffortUnitList = _.sortBy(environmentData.EffortUnitList, 'UnitName');
                }
                var model = new EffortUnitViewModel(effortUnit);
                taskrow.modalCurrentModule.viewModel.EffortUnit.push(model);
                taskrow.modalCurrentModule.newEffortPopover.popover('hide');
            }
        });
    };
    NewTask.prototype.ResetSearchEffortUnit = function () {
        if (this.effortUnitSelector) {
            this.effortUnitSelector.SetData(this.GetAvailableEffortUnitList());
            this.effortUnitSelector.Clear();
        }
    };
    NewTask.prototype.SetupEffortUnitTemplate = function () {
        var self = this;
        taskrow.LoadTemplate(taskrow.templatePath + 'Task/EffortUnit', function (getHTML) {
            self.EffortUnitContent = getHTML({});
        });
    };
    NewTask.prototype.SetupEffortUnitPopover = function () {
        var self = this;
        this.newEffortPopover = $('#btnAddNewEffortUnit').popover({
            html: true,
            placement: 'right',
            title: Utils.FormatTitlePopover($('#btnAddNewEffortUnit')[0], Resources.Task.AddNewEffortUnit, true),
            content: function () {
                if (self.EffortUnitContent == null) {
                    var content = $('<div id="loadingEffortUnit" class="row-fluid info-popover">').html(Resources.Commons.Loading);
                    return content;
                }
                return self.EffortUnitContent;
            },
            callback: function () {
                $('#popover_effortunit input.effort-timepicker').timesheetpicker({
                    displayClass: 'btn dateHourText',
                    containerClass: 'absolute',
                    keepEditMode: false,
                    setTimecallback: function (time) {
                        self.ValidateEffortUnit();
                    }
                });
                $('#popover_effortunit #UnitName').focusout(function (e) {
                    self.ValidateEffortUnit();
                });
                if (self.newEffortUnitName) {
                    $('#popover_effortunit #UnitName').val(self.newEffortUnitName);
                    self.newEffortUnitName = null;
                }
                $('#popover_effortunit #btnSaveEffortUnit').off('click').on('click', function () { self.SaveEffortUnit(); return false; });
                $('#popover_effortunit #btnCancelEffortUnit').off('click').on('click', function () { self.newEffortPopover.popover('hide'); return false; });
            }
        }).on('shown', function (e) { if (self.effortUnitSelector)
            self.effortUnitSelector.instance.collapse(true); })
            .on('click', function (e) { e.stopPropagation(); e.preventDefault(); window.event.cancelBubble = true; return false; })
            .on('hidden', function (e) { e.stopPropagation(); });
    };
    NewTask.prototype.GetAvailableEffortUnitList = function () {
        var selectedEffortUnits = _.map(this.viewModel.EffortUnit(), function (x) { return x.EffortUnitID(); });
        var available = _.difference(_.pluck(environmentData.EffortUnitList, 'EffortUnitID'), selectedEffortUnits);
        return _.chain(environmentData.EffortUnitList)
            .filter(function (x) { return _.some(available, function (a) { return a == x.EffortUnitID; }); })
            .sortBy(function (x) { return x.UnitName; })
            .map(function (x) { return new TagItem(x.UnitName, null, x.EffortUnitID); }).value();
    };
    NewTask.prototype.RemoveEffortUnit = function (unit) {
        this.viewModel.EffortUnit.remove(unit);
        this.ResetSearchEffortUnit();
        this.CalcEffortUnitTotal();
    };
    NewTask.prototype.RemoveAllEffortUnit = function () {
        this.viewModel.EffortUnit.removeAll();
        this.ResetSearchEffortUnit();
        this.CalcEffortUnitTotal();
    };
    NewTask.prototype.CalcEffortUnitTotal = function () {
        var list = ko.toJS(this.viewModel.EffortUnit());
        var effortUnitListString = _.map(list, function (x) { return x.EffortUnitID + '|' + x.Amount; }).join(',');
        this.viewModel.EffortUnitListString(effortUnitListString);
        var total = _.sum(list, 'EffortTotalMinutes');
        this.viewModel.EffortEstimation(isNaN(total) ? 0 : total);
    };
    return NewTask;
}());
var NewTaskViewModel = /** @class */ (function () {
    function NewTaskViewModel() {
        var _this = this;
        this.SelectedIntervalText = ko.computed(function () {
            return taskrow.modalCurrentModule.allocationControl.viewModel.SelectedIntervalText() + ' <span class="caret"></span>';
        });
        this.Owner = ko.observable(new UserViewModel());
        this.TaskTitle = ko.observable(undefined);
        this.DueDate = ko.observable(undefined);
        this.TaskDueDate = ko.computed(function () {
            var taskduedate = '';
            if (this.DueDate() != null && this.DueDate() != '')
                taskduedate = $M(this.DueDate(), true).format('YYYY-MM-DDT00:00:00');
            return taskduedate;
        }, this);
        this.TaskNumber = ko.observable(undefined);
        this.ClientID = ko.observable(undefined);
        this.ClientNickName = ko.observable(undefined);
        this.JobNumber = ko.observable(undefined);
        this.JobID = ko.observable(undefined);
        this.DeliverableID = ko.observable(undefined);
        this.TagContextID = ko.observable(undefined);
        this.EffortRequired = ko.observable(false);
        this.TemplateRequired = ko.observable(false);
        this.InvalidEffortEstimation = ko.observable(false);
        this.InvalidTemplate = ko.observable(false);
        this.DeliverableRequired = ko.observable(false);
        this.InvalidDeliverable = ko.observable(false);
        this.UserAllocationID = ko.observable(undefined);
        this.TaskItemTemplateID = ko.observable(undefined);
        this.RequestContactID = ko.observable(undefined);
        this.RequestContacts = ko.observableArray([]);
        this.RequestContactName = ko.computed(function () {
            if (!this.RequestContactID())
                return '';
            var contact = _(this.RequestContacts()).where({ ClientContactID: this.RequestContactID() })[0];
            if (!contact)
                return '';
            return contact.ContactName;
        }, this);
        this.TaskTags = ko.observableArray([]);
        this.TaskMembers = ko.observableArray([]);
        this.TaskItemComment = ko.observable(undefined);
        this.CountAttachments = ko.observable(0);
        this.EffortEstimation = ko.observable(0);
        this.EffortUnitListString = ko.observable('');
        this.SelectedEffortEstimationType = ko.observable(EnumTimepickerMode.Hours);
        this.SelectedEffortEstimationText = ko.computed(function () {
            if (this.SelectedEffortEstimationType() == EnumTimepickerMode.Hours)
                return Resources.Commons.Hours;
            else if (this.SelectedEffortEstimationType() == EnumTimepickerMode.Days)
                return Resources.Commons.Days;
            else if (this.SelectedEffortEstimationType() == null)
                return Resources.Task.EffortUnit;
            return '';
        }, this);
        this.EffortUnit = ko.observableArray([]);
        this.EffortUnit.subscribe(function (list) {
            if (list.length > 3) {
                $('#effortUnitTableContainer').jsScroll();
            }
        }, this);
        this.EffortUnitTotalAmount = ko.computed(function () {
            return _.chain(this.EffortUnit()).map(function (x) { return x.Amount(); }).sum().value();
        }, this);
        this.EffortUnitTotalMinutes = ko.computed(function () {
            return _.chain(this.EffortUnit()).map(function (x) { return x.EffortTotalMinutes(); }).sum().value();
        }, this);
        this.StandBy = ko.observable(false);
        this.RequestTypeID = ko.observable(undefined);
        this.RequestTypeComputed = ko.computed(function () {
            return this.RequestTypeID();
        }, this).extend({ throttle: 500 });
        this.RequestTypeComputed.subscribe(function (requestTypeID) {
            if (requestTypeID > 0)
                $("select#RequestTypeID").trigger('task:applytemplate', [requestTypeID]);
        }, this);
        this.InvalidRequestType = ko.observable(false);
        this.RequestTypeList = ko.observableArray([]);
        this.ContextRequestTypeList = ko.observableArray([]);
        this.RequestTypeForm = ko.computed(function () {
            var id = _this.RequestTypeID();
            if (!id)
                return undefined;
            var requestType = _this.RequestTypeList().filter(function (x) { return x.RequestTypeID == +id; })[0];
            if (!requestType || !requestType.DynFormMetadata)
                return undefined;
            return JSON.parse(requestType.DynFormMetadata);
        }, this);
    }
    NewTaskViewModel.prototype.clearSelectedOwner = function () {
        this.Owner(new UserViewModel());
    };
    return NewTaskViewModel;
}());
var EffortUnitViewModel = /** @class */ (function () {
    function EffortUnitViewModel(data) {
        this.EffortUnitID = ko.observable(undefined);
        this.UnitName = ko.observable('');
        this.Effort = ko.observable(0);
        this.Amount = ko.observable(1);
        this.Amount.subscribe(function (value) {
            if (value % 1 > 0)
                this.Amount(Math.floor(value));
        }, this);
        this.EffortTotalMinutes = ko.computed(function () {
            var total = this.Effort() * this.Amount();
            setTimeout(function () {
                if (taskrow.modalCurrentModule)
                    taskrow.modalCurrentModule.CalcEffortUnitTotal();
                else if (taskrow.currentModule.currentTask)
                    taskrow.currentModule.currentTask.CalcEffortUnitTotal();
            }, 10);
            return isNaN(total) ? 0 : total;
        }, this);
        this.FormatName = ko.computed(function () {
            return this.UnitName() + ' - ' + Utils.MinuteToHour(this.Effort());
        }, this);
        if (data)
            this.refreshData(data);
    }
    EffortUnitViewModel.prototype.refreshData = function (data) {
        this.EffortUnitID(data.EffortUnitID);
        this.UnitName(data.UnitName);
        this.Effort(data.Effort);
    };
    return EffortUnitViewModel;
}());
define(function () {
    return NewTask;
});
//# sourceMappingURL=NewTask.js.map