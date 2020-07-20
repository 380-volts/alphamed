///<reference path="../../Main/App.ts"/>
///<reference path="TaskAttachments.ts"/>
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
var TaskDetail = /** @class */ (function () {
    function TaskDetail() {
        this.waitingFastCommentReturn = false;
        this.pendingImageVerifierInterval = null;
        this.refreshLastReadDate = false;
        this.unloading = false;
        this.extranetTabDone = false;
        this.PostExtranetItem_End = null;
        this.taskUrlType = null;
        this.aditionalTaskUrlParams = {};
        //controlar tarefas
        this.siblingsTasks = [];
        this.loadedTasks = {};
        this.TASK_HEADER_SCENARIO = {
            ReopenTask: 1,
            ChangeDueDate: 2,
            ChangeTitle: 3,
            ChangeMembers: 4,
            ChangeEffortEstimation: 5,
            ChangeRequestContact: 6,
            ChangeDeliverable: 7,
            ChangeExtranetMembers: 8,
            ChangeRemainingEffortEstimation: 9,
            ChangeDueDateOrder: 10
        };
        this.MembersToSearch = [];
        this.headerTimesheetAttempts = 0;
        this.currentShareAttachmentViewModel = null;
        this.shareExtranetAttachmentViewModel = null;
        this.remainingEffortPopoverElement = null;
        this.remainingEffortTimesheetpicker = null;
        this.extranetContactsToSearch = null;
        this.changeDueDateViewModel = null;
        this.changeDueDateAllocationControl = null;
        this.changeEffortestimationViewModel = null;
        this.changeRemainingEffortEstimationViewModel = null;
        this.changeDueDateOrderViewModel = null;
        //#region Effort Unit
        this.initialEffortEstimationType = null;
        this.effortEstimationCurrentTaskData = null;
        this.effortUnitSelector = null;
        this.EffortUnitContent = null;
        this.newEffortUnitName = null;
        this.newEffortPopover = null;
        this.taskMinutesViewModel = null;
        this.PostExtranetItem_End = this.OnNewExtranetPostEnd.bind(this);
    }
    TaskDetail.prototype.Init = function (taskInfo, taskUrlType, aditionalTaskUrlParams) {
        this.parentTaskInfo = _.extend({}, taskInfo);
        this.selectedTaskInfo = _.extend({}, taskInfo);
        this.taskUrlType = taskUrlType;
        this.aditionalTaskUrlParams = aditionalTaskUrlParams;
    };
    TaskDetail.prototype.OnClose = function () {
        if (this.attachmentControl != null)
            this.attachmentControl.Destroy();
        if (this.allocationControl != null) {
            this.allocationControl.Destroy();
            this.allocationControl.Reset();
        }
        Utils.CleanNode($('.task-details')[0]);
        this.unloading = true;
        clearInterval(this.pendingImageVerifierInterval);
    };
    TaskDetail.prototype.OnSave = function (Event) {
    };
    TaskDetail.prototype.TryDownloadGoogleDrive = function () {
        var driveEnabled = _.any(environmentData.CurrentUserExternalServices, function (item) {
            return item.ExternalServiceID == 2;
        });
        if (driveEnabled)
            return true;
        UI.ConfirmYesNo(Resources.TaskAttachment.GoogleDriveIntegrationAsk, function (yes) {
            if (yes)
                location.href = "#taskcentral/team/" + environmentData.currentUserID;
        });
        return false;
    };
    TaskDetail.prototype.UnFavorite = function () {
        this.Favorite(false);
    };
    TaskDetail.prototype.Favorite = function (selected) {
        selected = (selected === undefined ? true : !!selected);
        var args = _.extend({}, this.selectedTaskInfo, { favorite: selected });
        var url = "Task/Favorite?" + $.param(args);
        var self = this;
        taskrow.DisplayLoading();
        $.ajax({
            url: url,
            success: function (data, status) {
                taskrow.HideLoading();
                self.serverData.TaskData.Favorite = selected;
                self.viewModel.SelectedTask.Favorite(selected);
                self.UpdateSiblingTask(self.serverData.TaskData);
                self.RefreshLoadedTask(self.serverData.TaskData);
                if (taskrow.currentModule['constructor'] == TaskCentral)
                    taskrow.currentModule.UpdateTask(self.selectedTaskInfo.taskNumber, { Favorite: selected });
            }
        });
    };
    TaskDetail.prototype.GetDataURL = function (taskNumber) {
        var taskData = _.extend({}, this.selectedTaskInfo, { taskNumber: (taskNumber || this.selectedTaskInfo.taskNumber) });
        return "Task/TaskDetail?" + $.param(taskData) + '&connectionID=' + SignalrHub.MainHub.connection.id;
    };
    TaskDetail.prototype.GetParentDataURL = function () {
        return "Task/ParentTaskDetail?" + $.param(this.parentTaskInfo);
    };
    TaskDetail.prototype.RefreshSiblingTasks = function (siblingTasks) {
        this.siblingsTasks = [];
        _.each(siblingTasks, function (task) {
            var subtaskTaskVersion = {
                TaskID: task.TaskID,
                TaskNumber: task.TaskNumber,
                RowVersion: task.RowVersion,
                TaskTitle: task.TaskTitle
            };
            this.siblingsTasks.push(subtaskTaskVersion);
        }, this);
    };
    TaskDetail.prototype.UpdateSiblingTask = function (siblingTask) {
        var siblingTaskToUpdate = _.filter(this.siblingsTasks, function (t) { return t.TaskID == siblingTask.TaskID; })[0];
        if (siblingTaskToUpdate) {
            siblingTaskToUpdate.RowVersion = siblingTask.RowVersion;
            siblingTaskToUpdate.TaskTitle = siblingTask.TaskTitle;
        }
    };
    TaskDetail.prototype.RefreshLoadedTask = function (taskData) {
        this.loadedTasks[taskData.TaskID] = taskData;
    };
    TaskDetail.prototype.Show = function (afterShowTaskCallback) {
        var self = this;
        var template = 'Task/TaskDetail', templateUrl = taskrow.templatePath + template;
        var dataUrl = this.GetDataURL();
        var onDataComplete = function (taskData) {
            if (self.unloading) {
                taskrow.HideLoading();
                return;
            }
            if (taskData.Success === false) {
                taskrow.HideLoading();
                UI.Alert(taskData.Message);
                if (self.errorCallback)
                    self.errorCallback();
                else
                    Navigation.GoBack();
                return;
            }
            self.serverData = taskData;
            if (!self.serverData.LastReadDate)
                self.serverData.LastReadDate = $M(null, true).toJsonDate(true);
            //atualiza tasknumber da tarefa principal
            if (taskData.TaskData.ParentTask != null)
                self.parentTaskInfo = _.extend({}, self.parentTaskInfo, { taskNumber: taskData.TaskData.ParentTask.TaskNumber });
            //Controle de parent/subtasks e quais já foram carregadas
            self.RefreshLoadedTask(taskData.TaskData);
            self.RefreshSiblingTasks(taskData.SiblingTasks);
            self.pendingImageVerifierInterval = setInterval(function (x) { return x.VerifyPendingImages(); }, 5000, self);
            self.viewModel = new TaskDetailViewModel(taskData, self.taskUrlType, self.aditionalTaskUrlParams);
            self.viewModel.SelectedTask.TaskImages.subscribe(function (images) {
                setTimeout(function () {
                    var galleryExists = (self.imageGallery && self.imageGallery.length > 0);
                    if (galleryExists) {
                        try {
                            $(".taskAttachmentList .images").imageGallery("reset");
                        }
                        catch (e) {
                            galleryExists = false;
                        }
                    }
                    if (!galleryExists)
                        self.imageGallery = $(".taskAttachmentList .images").imageGallery({ moduleContainer: taskrow });
                }, 100);
            });
            self.viewModel.SelectedTask.ExternalImages.subscribe(function (images) {
                setTimeout(function () {
                    var galleryExists = (self.externalImageGallery && self.externalImageGallery.length > 0);
                    if (galleryExists) {
                        try {
                            $(".externalAttachmentList .images").imageGallery("reset");
                        }
                        catch (e) {
                            galleryExists = false;
                        }
                    }
                    if (!galleryExists)
                        self.externalImageGallery = $(".externalAttachmentList .images").imageGallery({ moduleContainer: taskrow });
                }, 100);
            });
            //Acessando a task pela pagina do projeto
            if (taskrow.currentModule.jobHome) {
                var job = taskData.JobData;
                Activity.RegisterJob({ clientNickName: job.Client.ClientNickName, jobTitle: job.JobTitle, jobNumber: job.JobNumber, urlData: job.UrlData });
                Utils.ChangeJobTab(job.JobNumber, job.JobTitle, URLs.BuildUrl(job.UrlData));
                Activity.RegisterClient({ clientNickName: job.Client.ClientNickName, displayName: job.Client.DisplayName, urlData: job.Client.UrlData });
                Utils.ChangeClientTab(job.Client.DisplayName, URLs.BuildUrl(job.Client.UrlData));
            }
            taskrow.LoadTemplate(templateUrl, function (template) {
                if (self.unloading) {
                    taskrow.HideLoading();
                    return;
                }
                var currentTask = $('.task-details');
                if (currentTask.length > 0)
                    currentTask.remove();
                var dashboardContent = $('#dashboard>.dashboard-content');
                dashboardContent.hide();
                var userData = {
                    currentUserID: environmentData.currentUser.UserID,
                    currentUserLogin: environmentData.currentUser.UserLogin,
                    currentUserSmallMask: environmentData.userMask.SmallRelativeURL + environmentData.currentUser.UserHashCode + '.jpg'
                };
                $(template($.extend({}, taskData, userData))).appendTo("#dashboard");
                ko.applyBindings(self.viewModel, $('.task-details')[0]);
                //Iniciar galeria de imagens
                self.imageGallery = $(".taskAttachmentList .images").imageGallery({ moduleContainer: taskrow });
                self.externalImageGallery = $(".externalAttachmentList .images").imageGallery({ moduleContainer: taskrow });
                taskrow.HideLoading();
                self.SetupCommentAreas();
                self.SetupNewPostSection();
                self.MarkTaskAsRead();
                self.SetupSelectedTaskMembersPopover();
                self.SetupSelectedTaskExternalMembersPopover();
                self.SetupDeliverablesPopover();
                self.SetupRequestType();
                self.SetupApprovalsTaskAttachments();
                self.SetupEffortEstimatePopover();
                setTimeout(function () {
                    self.SetupHideTaskAttachments();
                }, 10);
                Utils.SetupValidation($('#frmSaveTaskItem'));
                //garantir marcação do parent task quando abrir uma subtask que nao esta na tasklist
                var curModule = taskrow.currentModule;
                if (curModule.taskCentral || curModule.jobHome)
                    curModule.MarkCurrentTask();
                if (afterShowTaskCallback)
                    afterShowTaskCallback();
            });
        };
        $.ajax({
            url: dataUrl,
            success: function (data, status) {
                onDataComplete(data);
            },
            error: function (response) {
                taskrow.HideLoading();
                //Unauthorized
                if (response.status == 401) {
                    UI.Alert(Resources.DenialOfAccess.Task);
                    Navigation.GoBack();
                    return false;
                }
            }
        });
    };
    TaskDetail.prototype.ReloadTaskByNotification = function (taskData) {
        var desiredTask = this.GetTaskOrSubtask(taskData.TaskNumber, taskData.JobNumber);
        if (desiredTask && desiredTask.RowVersion != taskData.RowVersion) {
            desiredTask.RowVersion = taskData.RowVersion;
            //Reload task
            if (taskData.TaskID == this.viewModel.SelectedTask.TaskData().TaskID)
                this.ReloadTask(null, true);
            else if (taskData.TaskID == this.viewModel.ParentTask.TaskID())
                this.ReloadParentTask();
        }
    };
    TaskDetail.prototype.ReloadParentTask = function () {
        var self = this;
        taskrow.DisplayLoading();
        $.ajax({
            url: this.GetParentDataURL(),
            success: function (data, status) {
                taskrow.HideLoading();
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    return;
                }
                self.viewModel.refreshParentTask(data);
            },
            error: function () {
                taskrow.HideLoading();
                UI.Alert(Resources.Commons.UnexpectedError);
            }
        });
    };
    TaskDetail.prototype.ReloadTask = function (callback, keepCurrentPost) {
        var self = this;
        var dataUrl = this.GetDataURL();
        taskrow.DisplayLoading();
        $.ajax({
            url: dataUrl,
            success: function (data, status) {
                taskrow.HideLoading();
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    return;
                }
                if (!self.refreshLastReadDate)
                    data.LastReadDate = self.serverData.LastReadDate;
                else
                    self.refreshLastReadDate = true;
                self.serverData = data;
                self.viewModel.refreshData(data);
                self.RefreshLoadedTask(data.TaskData);
                self.RefreshSiblingTasks(data.SiblingTasks);
                if (!keepCurrentPost)
                    self.ResetPostArea();
                if (self.viewModel.SelectedTask.NewPost.PostAction() != NewPostAction.ChildTask)
                    self.initialEffortEstimationType = null;
                self.SetupSubtaskKeypress();
                self.SetupPostButtons(self.viewModel.SelectedTask.NewPost.PostAction() == NewPostAction.None);
                self.SetupSelectedTaskMembersPopover();
                self.SetupSelectedTaskExternalMembersPopover();
                self.SetupApprovalsPopover();
                self.MarkTaskAsRead();
                self.SetupApprovalsTaskAttachments();
                self.SetupEffortEstimatePopover();
                if (self.viewModel.ExtranetOpen()) {
                    self.SetupExtranetActions();
                    if (self.viewModel.SelectedTask.ExtranetPending())
                        self.MarkTaskExtranetAsRead();
                }
                if (callback)
                    callback();
            },
            error: function (response) {
                taskrow.HideLoading();
                //Unauthorized
                if (response.status == 401) {
                    taskrow.currentModule.CloseDashboardContent();
                    return false;
                }
            }
        });
    };
    TaskDetail.prototype.GetTaskOrSubtask = function (taskNumber, jobNumber) {
        if (!this.viewModel || !this.viewModel.Job() || this.viewModel.Job().JobNumber != jobNumber)
            return null;
        var task = _.filter(this.siblingsTasks, function (t) { return t.TaskNumber == taskNumber; })[0];
        return task;
    };
    TaskDetail.prototype.ResetExtranetPostArea = function () {
        this.viewModel.NewExternalTaskItem.Reset();
        this.viewModel.refreshExternalTaskItem(this.serverData.TaskData);
        $('#newExternalTaskItem').hide();
        $('#extranetActionButtons').show();
    };
    TaskDetail.prototype.SelectTask = function (task, callback) {
        taskrow.DisplayLoading();
        if (!task)
            task = _.filter(this.siblingsTasks, function (t) { return t.TaskNumber == this.parentTaskInfo.taskNumber; }, this)[0];
        if (task.TaskID == this.viewModel.SelectedTask.TaskData().TaskID) {
            if (callback)
                callback();
            taskrow.HideLoading();
            return;
        }
        var onDataComplete = function (taskData) {
            this.selectedTaskInfo.taskNumber = taskData.TaskNumber;
            this.serverData.TaskData = taskData;
            this.viewModel.SelectedTask.refreshData(taskData);
            this.viewModel.ExtranetOpen(false);
            this.ResetExtranetPostArea();
            this.ResetPostArea();
            this.SetupSubtaskKeypress();
            this.SetupSelectedTaskMembersPopover();
            this.SetupSelectedTaskExternalMembersPopover();
            this.SetupApprovalsPopover();
            this.SetupApprovalsTaskAttachments();
            this.SetupEffortEstimatePopover();
            setTimeout(function () {
                this.SetupHideTaskAttachments();
            }.bind(this), 10);
            var markAsRead = this.MarkTaskAsRead();
            if (markAsRead) {
                $.ajax({
                    url: 'Task/MarkTaskAsRead',
                    data: { jobNumber: this.serverData.JobData.JobNumber, taskNumber: taskData.TaskNumber, connectionID: SignalrHub.MainHub.connection.id },
                    success: function (success) {
                        //...
                    }
                });
            }
            var taskDataURL = URLs.GetAbsoluteUrl('../' + taskData.TaskNumber);
            if (location.hash != taskDataURL)
                location.hash = taskDataURL;
            if (callback)
                callback();
            taskrow.HideLoading();
        }.bind(this);
        var taskDataLoaded = this.loadedTasks[task.TaskID];
        var needLoad = !taskDataLoaded || taskDataLoaded.RowVersion != task.RowVersion;
        if (needLoad) {
            var self = this;
            $.ajax({
                url: this.GetDataURL(task.TaskNumber),
                success: function (data, status) {
                    if (data.Success === false) {
                        taskrow.HideLoading();
                        UI.Alert(data.Message);
                        Navigation.GoBack();
                        return;
                    }
                    if (!self.refreshLastReadDate)
                        data.LastReadDate = self.serverData.LastReadDate;
                    else
                        self.refreshLastReadDate = true;
                    self.serverData = data;
                    self.viewModel.refreshData(data);
                    self.RefreshLoadedTask(data.TaskData);
                    self.RefreshSiblingTasks(data.SiblingTasks);
                    onDataComplete(data.TaskData);
                },
                error: function (response) {
                    taskrow.HideLoading();
                    //Unauthorized
                    if (response.status == 401) {
                        UI.Alert(Resources.DenialOfAccess.Task);
                        Navigation.GoBack();
                        return false;
                    }
                }
            });
        }
        else
            onDataComplete(taskDataLoaded);
    };
    TaskDetail.prototype.ShowExtranet = function () {
        this.SelectTask(null, function () {
            this.viewModel.ExtranetOpen(true);
            this.SetupExtranetTab();
        }.bind(this));
    };
    TaskDetail.prototype.OpenDeliverableDetails = function () {
        if ($('.deliverableDetails').is(':visible'))
            $('.deliverableDetails').hide();
        else
            $('.deliverableDetails').show();
        if (!this.viewModel.DeliverableDetails.Loaded()) {
            $('.deliverableDetails').show();
            $.get('/Deliverable/GetDeliverableTasks', {
                deliverableID: this.viewModel.DeliverableDetails.DeliverableID(), listTasks: true, listTasksClosed: true, listSubtasks: false
            }, this.OnDeliverableDetailsLoaded.bind(this));
        }
        setTimeout(function () {
            $(document).one('click', function () {
                $('.deliverableDetails').hide();
            });
        }, 0);
    };
    TaskDetail.prototype.OnDeliverableDetailsLoaded = function (data) {
        this.viewModel.DeliverableDetails.RefreshData(data);
        this.viewModel.DeliverableDetails.Loaded(true);
    };
    TaskDetail.prototype.MarkTaskAsRead = function () {
        if (taskrow.currentModule.taskCentral) {
            var taskNumber = this.viewModel.SelectedTask.TaskData().TaskNumber;
            var markAsRead = taskrow.currentModule.MarkTaskAsRead(taskNumber);
            return markAsRead;
        }
        return false;
    };
    TaskDetail.prototype.MarkTaskExtranetAsRead = function () {
        var self = this;
        var markExtranetAsRead = this.viewModel.SelectedTask.ExtranetPending();
        var taskNumber = this.selectedTaskInfo.taskNumber;
        if (markExtranetAsRead) {
            $.ajax({
                url: 'Task/MarkTaskExtranetAsRead',
                data: { taskNumber: taskNumber, connectionID: SignalrHub.MainHub.connection.id },
                success: function (success) {
                    if (success) {
                        self.serverData.TaskData.ExtranetPending = false;
                        self.viewModel.SelectedTask.ExtranetPending(false);
                        self.UpdateSiblingTask(self.serverData.TaskData);
                        self.RefreshLoadedTask(self.serverData.TaskData);
                        taskrow.currentModule.UpdateTaskExtranetAsRead(taskNumber);
                    }
                }
            });
        }
    };
    TaskDetail.prototype.SetupPostButtons = function (showButtonsArea) {
        var self = this;
        $('.btgPost')[showButtonsArea ? 'show' : 'hide']();
        //Buttons
        var btnAnswer = $('.btn[data-action=answer]');
        var btnForward = $('.btn[data-action=forward]');
        var btnComment = $('.btn[data-action=comment]');
        var btnClose = $('.btn[data-action=close]');
        btnForward[this.viewModel.SelectedTask.TaskData().ActualPermissions.CanForwardTask ? 'show' : 'hide']();
        btnAnswer[this.viewModel.SelectedTask.TaskData().ActualPermissions.CanAnswerTask ? 'show' : 'hide']();
        btnClose[this.viewModel.SelectedTask.TaskData().ActualPermissions.CloseSubtasks ? 'show' : 'hide']();
        btnComment.show();
        var btnShowSubtasks = $('.subtaskBtn');
        btnShowSubtasks[showButtonsArea && self.viewModel.SelectedTask.Subtasks().length == 0 ? 'show' : 'hide']();
    };
    TaskDetail.prototype.SelectDueDateInterval = function (interval) {
        this.viewModel.SelectedTask.NewPost.ForceLoadAllocation(true);
        this.allocationControl.viewModel.UserID(this.viewModel.SelectedTask.NewPost.ActualOwner().UserID);
        if (this.viewModel.SelectedTask.NewPost.ActualOwner().UserID > 0) {
            if (interval != null) {
                this.allocationControl.viewModel.SetInterval(interval);
            }
            else {
                this.allocationControl.viewModel.OpenDatePicker();
            }
        }
    };
    TaskDetail.prototype.RefreshTemplatesList = function (clientNickname, jobNumber) {
        var data = { clientNickname: clientNickname, jobNumber: jobNumber };
        var self = this;
        $.get('/Task/ListTemplatesForTaskCreation', data, function (result) {
            self.commentArea.AddTemplateList(result);
            $('#requestTypePhrase').css("top", result && result.length > 0 ? '2.7em' : '');
        });
        $(this.commentArea).on('templateselected', function (e, template) {
            self.viewModel.SelectedTask.NewPost.TaskItemTemplateID(template.TaskItemTemplateID);
        });
    };
    TaskDetail.prototype.VerifyPendingImages = function () {
        if (Cookies.Get('pending_images')) {
            Cookies.Set('pending_images', null);
            $('.text-comment img, .newTaskItemComment img, #taskImagesThumbs img').map(function (index, item) { item.src += '&n=' + (new Date()).getTime(); });
        }
    };
    TaskDetail.prototype.RefreshRequestTypeListData = function () {
        if (!this.serverData.CanChangeRequestType)
            return;
        var self = this;
        var clientNickName = this.serverData.JobData.Client.ClientNickName;
        var jobNumber = this.serverData.JobData.JobNumber;
        var ownerUser = this.viewModel.SelectedTask.NewPost.ActualOwner();
        var data = { clientNickName: clientNickName, jobNumber: jobNumber, ownerUserID: ownerUser ? ownerUser.UserID : null };
        var previousRequestTypeID = self.viewModel.SelectedTask.NewPost.RequestTypeID();
        $.get('/Task/ListRequestTypeForTask', data, function (result) {
            self.viewModel.RefreshContextRequestTypeList(result);
            var existsPreviousRequestType = _.any(result, function (x) { return x.RequestTypeID == previousRequestTypeID; });
            if (existsPreviousRequestType) {
                self.viewModel.SelectedTask.NewPost.RequestTypeID(previousRequestTypeID);
                self.viewModel.SelectedTask.NewPost.RequestTypeID.valueHasMutated();
            }
            else {
                self.viewModel.SelectedTask.NewPost.RequestTypeID(null);
                self.viewModel.SelectedTask.NewPost.RequestTypeID.valueHasMutated();
            }
        });
    };
    TaskDetail.prototype.CheckSubtasks = function (user) {
        var existingTask = null;
        var subtasks = this.viewModel.SelectedTask.Subtasks();
        var userSubtask = _.chain(subtasks)
            .filter(function (x) { return x.ChildTask() != null && x.ChildTask().Owner.UserID == user.UserID; })
            .sortBy(function (x) { return $M(x.CreationDate, true); })
            .last()
            .value();
        if (userSubtask)
            existingTask = userSubtask.ChildTask();
        this.viewModel.SelectedTask.NewPost.addSubtaskOwner(user, existingTask);
    };
    TaskDetail.prototype.SetupNewPostSection = function () {
        var _this = this;
        var self = this;
        //Buttons
        var btnAnswer = $('.btn[data-action=answer]');
        var btnForward = $('.btn[data-action=forward]');
        var btnComment = $('.btn[data-action=comment]');
        var btnClose = $('.btn[data-action=close]');
        var btnMoreOptions = $('.btn[data-action=fullcomment]');
        var btnSave = $('#btnSaveTaskItem');
        btnAnswer.off('click').addListener('click', function () { _this.BeginAnswer(); });
        btnForward.off('click').addListener('click', function () { _this.BeginForward(); });
        btnComment.off('click').addListener('click', function () { _this.BeginComment(); });
        btnClose.off('click').addListener('click', function () { _this.BeginCloseChild(); });
        btnSave.off('click').addListener('click', function () { _this.SavePost(); });
        btnMoreOptions.off('click').addListener('click', function () { _this.BeginComment(); _this.ShowPostControls(); });
        var taskData = self.viewModel.SelectedTask.TaskData();
        //setup post buttons
        self.SetupPostButtons(true);
        self.SetupSearchOwnerUsers();
        //Notify user search 
        self.notifyUserSearch = new SearchUser({
            searchBox: $('#notifyUserSearch')[0],
            mode: SearchUserMode.Unique,
            renderUsers: false,
            initialUsers: [],
            placeholder: Resources.Commons.SelectOne,
            clearAfterSelected: true,
            showUserIcon: true
        });
        self.notifyUserSearch.selectUserCallback = function (user) {
            self.viewModel.SelectedTask.NewPost.addUserToBeNotified(user.UserID, user.UserHashCode, user.UserLogin);
        };
        self.notifyUserSearch.Init();
        //New owner allocation
        var taskData = self.viewModel.SelectedTask.TaskData();
        if (taskData.ActualPermissions.ChangeDueDate) {
            self.allocationControl = new AllocationControl();
            self.allocationControl.Init($('#newpostDueDateSelector')[0], 3, //max task visible in day
            function (date) {
                self.SelectNewDueDate.apply(self, [this, date]);
            }, self.viewModel.SelectedTask.TaskTitle(), Resources.Task.NewDueDate);
            self.viewModel.AllocationControlLoaded(true);
        }
        //timesheet
        var timesheetOnApproval = (HeaderTimesheet.serverData != null && HeaderTimesheet.serverData.DayStatusID == TimesheetDayStatus.Approval);
        var invalidJob = (this.serverData.JobData.JobStatusID == EnumJobStatus.Blocked || this.serverData.JobData.JobStatusID == EnumJobStatus.Closed);
        if (!this.viewModel.RequiredTimesheet() || timesheetOnApproval || invalidJob)
            $('#SpentTime').val('0');
        //caso já tenha enviado a timesheet do dia, não pode lançar mais horas, espera carregar timesheetHeader
        this.SetupTimesheetpicker();
        //Progress
        //UI.SetupTaskProgress($('#progressSelector .task-progress')[0], $('#PercentComplete')[0], $('#lblProgress')[0]);
        $('#lblSpentTime').show();
    };
    TaskDetail.prototype.SetupSearchOwnerUsers = function () {
        var self = this;
        var _getMembers = function (group) {
            if (!group)
                return;
            if (group.Members && group.Members.length > 0)
                self.MembersToSearch = self.MembersToSearch.concat(_.clone(group.Members));
            if (group.Groups && group.Groups.length > 0)
                for (var i = 0; i < group.Groups.length; i++)
                    _getMembers(group.Groups[i]);
        };
        if (self.serverData.HierarchyGroups && self.serverData.HierarchyGroups.length > 0)
            for (var i = 0; i < self.serverData.HierarchyGroups.length; i++)
                _getMembers(self.serverData.HierarchyGroups[i]);
        var canCreateTasksForAll = self.serverData.CreateTasksForAllGroupsPermission || self.serverData.ViewAllGroupsPermission;
        var canForwardTasksForAll = self.serverData.ForwardTasksForAllGroupsPermission || self.serverData.ViewAllGroupsPermission;
        self.ownerSearch = new SearchUser({
            searchBox: $('#searchNewOwner')[0],
            mode: SearchUserMode.Unique,
            renderUsers: true,
            initialUsers: [],
            placeholder: Resources.Task.Owner,
            clearAfterSelected: true,
            showUserIcon: false,
            dueDate: $M(self.viewModel.SelectedTask.TaskData().DueDate),
            allowAbsentUser: true,
            usersToSearch: (!canForwardTasksForAll ? self.MembersToSearch : null)
        });
        self.ownerSearch.selectUserCallback = function (user) {
            if (user.Absent) {
                var absenceStartDate = $M(user.AbsenceStartDate);
                var absenceEndDate = $M(user.AbsenceEndDate);
                var taskDueDate = $M(self.viewModel.SelectedTask.NewPost['NewDueDate']());
                if (taskDueDate <= absenceEndDate && taskDueDate >= absenceStartDate)
                    self.viewModel.SelectedTask.NewPost.clearDueDate();
            }
            else {
                self.viewModel.SelectedTask.NewPost.setDueDate(self.viewModel.SelectedTask.TaskData()['DueDate']);
            }
            self.SelectNewOwner.apply(self, [this, user]);
        };
        self.ownerSearch.deleteUserCallback = function () {
            self.SelectNewOwner.apply(self, [this, null]);
        };
        self.ownerSearch.Init();
        //Seleção de responsaveis para replicar post em subtarefas
        self.subtasksOwnerSearch = new SearchUser({
            searchBox: $('#subtasksOwnerSearch')[0],
            mode: SearchUserMode.Unique,
            renderUsers: false,
            initialUsers: [],
            placeholder: Resources.Commons.Owner,
            clearAfterSelected: true,
            showUserIcon: true,
            usersToSearch: (!canCreateTasksForAll ? self.MembersToSearch : null)
        });
        self.subtasksOwnerSearch.selectUserCallback = function (user) {
            if (!_.any(self.viewModel.SelectedTask.NewPost.SubtasksOwnerList(), function (x) { return x.UserID == user.UserID; })) {
                self.SelectNewOwner.apply(self, [this, user]);
                self.CheckSubtasks.apply(self, [user]);
            }
        };
        self.subtasksOwnerSearch.Init();
    };
    TaskDetail.prototype.SetupTimesheetpicker = function () {
        var self = this;
        if (!environmentData.ShowTimesheet)
            return false;
        if (!HeaderTimesheet.serverData && self.headerTimesheetAttempts < 5) {
            setTimeout(function ($this) {
                $this.SetupTimesheetpicker();
            }, 300, this);
            self.headerTimesheetAttempts++;
            return false;
        }
        self.headerTimesheetAttempts = 0;
        console.log(['HeaderTimesheet.serverData.DayStatusID', HeaderTimesheet.serverData.DayStatusID]);
        var timesheetOnApproval = (HeaderTimesheet.serverData != null && HeaderTimesheet.serverData.DayStatusID == TimesheetDayStatus.Approval);
        var invalidJob = (this.serverData.JobData.JobStatusID == EnumJobStatus.Blocked || this.serverData.JobData.JobStatusID == EnumJobStatus.Closed);
        if (timesheetOnApproval) {
            $('#SpentTime').val('0');
            $('#SpentTime').removeAttr('timesheetpicker_initialized');
            $("#SpentTime").data('time-selected', false);
            $('#SpentTimeApproval_Info').show();
        }
        else if (invalidJob) {
            $('#SpentTime').val('0');
            $('#SpentTime').removeAttr('timesheetpicker_initialized');
            $("#SpentTime").data('time-selected', false);
            $('#SpentTimeApproval_Info_InvalidJob').show();
        }
        else {
            $('#SpentTime').attr('timesheetpicker_initialized', true);
            $('#SpentTimeApproval_Info').hide();
            $('#SpentTimeApproval_Info_InvalidJob').hide();
            $('#SpentTime').timesheetpicker({
                openStart: self.viewModel.RequiredTimesheet(),
                displayClass: 'btn dateHourText',
                containerClass: 'absolute',
                placeHolderText: Resources.Task.FillTheSpentTime,
                zeroToPlaceholder: false,
                setTimecallback: function (minutesSpent) {
                    if (minutesSpent != null && minutesSpent != 0) {
                        $("#SpentTime").data('time-selected', true);
                        $("#SpentTime").val(minutesSpent.toString());
                        $("#SpentTime").valid();
                        $('#frmSaveTaskItem')[0].validator.element('#SpentTime');
                    }
                }
            });
        }
    };
    TaskDetail.prototype.ReloadTaskComment = function () {
        var self = this;
        setTimeout(function () {
            var taskComment = $("#newTaskItemComment")[0].innerHTML;
            taskComment = Utils.ClearHTML(taskComment, 'format-content-');
            self.viewModel.SelectedTask.NewPost.Comment(taskComment);
        }, 100);
    };
    TaskDetail.prototype.SetupCommentAreas = function () {
        var _this = this;
        var self = this;
        var contentEditable = $("#newTaskItemComment")[0];
        var fastContentEditable = $("#fastCommentArea")[0];
        var buttonsContainer = $("#newTaskItemFormatButtons")[0];
        var dynFormContainer = $("#dynFormContainer")[0];
        //CommentArea Padrão
        self.commentArea = new FormatContent(contentEditable, buttonsContainer);
        self.commentArea.mentionsEnabled = true;
        self.commentArea.focusCallback = function () { };
        self.commentArea.changeValueCallback = function (value) {
            self.ReloadTaskComment();
        };
        //comentario em template com formulario estruturado
        this.dynForm = new DynFormViewer();
        this.dynForm.onChange = function (formHtml, fieldValues) {
            contentEditable.innerHTML = formHtml;
            _this.viewModel.SelectedTask.NewPost.Comment(formHtml);
        };
        this.dynForm.onRenderHtmlElement = function (element) { };
        this.dynForm.onPaste = function (ev) { self.attachmentControl.OnPaste(ev); };
        this.dynForm.onDrop = function (ev) { self.attachmentControl.OnDrop(ev); };
        //CommentArea Fast Comment
        self.fastCommentArea = new FormatContent(fastContentEditable, buttonsContainer);
        self.fastCommentArea.mentionsEnabled = true;
        self.fastCommentArea.focusCallback = function () { };
        self.fastCommentArea.changeValueCallback = function (value) {
            $("#newTaskItemComment")[0].innerHTML = self.fastCommentArea.GetContent();
            var textContent = $("#fastCommentArea")[0].textContent.replace(/[^a-zA-Z0-9 -_@!?:; \t\n]*/gi, '');
            var empty = (textContent == '');
            $('#spanClearFastComment').css('visibility', empty ? 'hidden' : '');
            $('#fastCommentPlaceHolder').css('display', empty ? '' : 'none');
            self.ReloadTaskComment();
        };
        //antes no keypress
        $("#fastCommentArea").on('keydown', function (e) {
            if (e.keyCode == 13 && e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.stopPropagation();
                e.preventDefault();
                _this.PostFastComment();
                return false;
            }
        });
        $('#fastCommentPlaceHolder').bind('click', function (e) { _this.fastCommentArea.Focus(); });
        self.fastCommentArea.changeUsersCallback = self.commentArea.changeUsersCallback = function (value) {
            var currentMembers = self.viewModel.SelectedTask.NewPost.NotificationUsers().map(function (x) { return x.UserID; });
            var pastMentionedUsers = self.viewModel.SelectedTask.NewPost.MentionedUsers || [];
            taskrow.ListUsers(function (users) {
                for (var i = currentMembers.length - 1; i >= 0; i--) {
                    if (_(pastMentionedUsers).contains(currentMembers[i]))
                        currentMembers.splice(i, 1);
                }
                var currentlyMentionedUsers = _(Array.prototype.splice.apply(value, [0])).clone();
                for (var i = currentlyMentionedUsers.length - 1; i >= 0; i--) {
                    if (_(currentMembers).contains(currentlyMentionedUsers[i])) {
                        currentlyMentionedUsers.splice(i, 1);
                    }
                }
                for (var i = 0; i < currentlyMentionedUsers.length; i++) {
                    currentMembers.push(currentlyMentionedUsers[i]);
                }
                self.viewModel.SelectedTask.NewPost.MentionedUsers = currentlyMentionedUsers;
                var result = currentMembers.map(function (x) { var user = _(users).where({ UserID: x })[0]; return { UserID: user.UserID, UserLogin: user.UserLogin, UserHashCode: user.UserHashCode }; });
                self.viewModel.SelectedTask.NewPost.NotificationUsers(result);
            });
        };
        $('#newTaskItemComment')[0].innerHTML = '';
        //comentada alteração - apenas criador mudar o template de uma tarefa vai depender de permissão/parametro à ser desenvolvido
        //Template pode ser alterado apenas pelo criador da tarefa
        //if (this.serverData.TaskData.CreationUserID == environmentData.currentUserID) 
        //{
        //    this.RefreshTemplatesList(this.serverData.JobData.Client.ClientNickName, this.serverData.JobData.JobNumber);
        //}
        self.commentArea.Init();
        self.fastCommentArea.Init();
    };
    TaskDetail.prototype.SetupAttachment = function () {
        var self = this;
        //Copiar arquivo existente
        $('#btnSelectTaskAttachment').off('click').on('click', (function () {
            var _this = this;
            var options = UI.CreateSaveCancelModalOptions(Resources.Task.SelectExistingAttachment, function (event, modal) {
                var element = modal.element;
                var ids = self.currentShareAttachmentViewModel.SelectedAttachmentsIDs();
                var attachments = self.currentShareAttachmentViewModel.AllAttachments().filter(function (x) { return ids.indexOf(x.TaskAttachmentID) >= 0; }).concat(self.currentShareAttachmentViewModel.AllImages().filter(function (x) { return ids.indexOf(x.TaskAttachmentID) >= 0; }));
                attachments = _.map(attachments, function (attachment) {
                    return _.extend(attachment, { Name: (attachment.Name.lastIndexOf('.') > -1) ? attachment.Name.substring(0, attachment.Name.lastIndexOf('.')) : attachment.Name });
                }, _this);
                self.viewModel.SelectedTask.NewPost.ExistingTaskAttachments(attachments);
                //InternalTaskAttachments
                modal.close();
            });
            options.onClose = function () {
                self.currentShareAttachmentViewModel = null;
            };
            options.style = 'width: 850px';
            taskrow.DisplayLoading();
            $.get('Task/GetTaskAttachments', { parentTaskNumber: self.parentTaskInfo.taskNumber }, function (data) {
                taskrow.HideLoading();
                if (!data.Success) {
                    UI.Alert(data.Message);
                    return false;
                }
                UI.ShowModalFromTemplateID('tmplSelectExistingAttachment', {}, options, function (modal) {
                    self.currentShareAttachmentViewModel = new ShareAttachmentViewModel();
                    self.currentShareAttachmentViewModel.RefreshData(data.Entity.Files, data.Entity.Images, data.Entity.Tasks);
                    ko.applyBindings(self.currentShareAttachmentViewModel, modal.element);
                    var onFilterChanges = function () {
                        UI.TriggerModalBodyResize();
                        $('#divExistingAttachmentsContent').jsScroll('refresh');
                    };
                    self.currentShareAttachmentViewModel.FilteredAttachments.subscribe(function (x) { return onFilterChanges(); });
                    self.currentShareAttachmentViewModel.FilteredImages.subscribe(function (x) { return onFilterChanges(); });
                    $('#divExistingAttachmentsContent').jsScroll();
                    UI.TriggerModalBodyResize();
                });
            });
        }).bind(this));
        if (self.attachmentControl != null)
            return;
        //Upload de novo arquivo
        require(['Scripts/ClientViews/Task/TaskAttachments'], function (attachments) {
            self.attachmentControl = new TaskAttachments($('#newTaskItemComment')[0], $('#newTaskItemAddAttachments')[0], $('#newTaskItemAttachmentsList')[0], $('#btnSaveTaskItem')[0]);
            self.attachmentControl.GoogleEnabled = ($.inArray(environmentData.ExternalServices.GoogleDrive, $.map(environmentData.CurrentUserExternalServices, function (x) { return x.ExternalServiceID; })) > -1);
            self.attachmentControl.Init();
            $('#newTaskItemFormatButtons #btnAddAttachment').off('click').on('click', function (e) {
                self.attachmentControl.AddSingleFile();
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
            $('#newTaskItemFormatButtons #btnAddGoogleDriveFile').off('click').on('click', function (e) {
                self.attachmentControl.AddGoogleDrive();
                e.stopPropagation();
                e.preventDefault();
                return false;
            });
        });
    };
    TaskDetail.prototype.SetupAttachmentFromExtranet = function () {
        var self = this;
        //Copiar arquivo existente
        $('#btnSelectExtranetAttachments').off('click').on('click', (function () {
            var _this = this;
            var options = UI.CreateSaveCancelModalOptions(/*Resources.Task.SelectExistingAttachment*/ 'Selecionar anexos da extranet', function (event, modal) {
                var element = modal.element;
                var ids = self.shareExtranetAttachmentViewModel.SelectedAttachmentsIDs();
                var attachments = self.shareExtranetAttachmentViewModel.AllAttachments().filter(function (x) { return ids.indexOf(x.AttachmentID) >= 0; }).concat(self.shareExtranetAttachmentViewModel.AllImages().filter(function (x) { return ids.indexOf(x.AttachmentID) >= 0; }));
                attachments = _.map(attachments, function (attachment) {
                    return _.extend(attachment, { Name: (attachment.Name.lastIndexOf('.') > -1) ? attachment.Name.substring(0, attachment.Name.lastIndexOf('.')) : attachment.Name });
                }, _this);
                self.viewModel.SelectedTask.NewPost.ExistingAttachments(attachments);
                modal.close();
            });
            options.onClose = function () {
                self.shareExtranetAttachmentViewModel = null;
            };
            options.style = 'width: 850px';
            taskrow.DisplayLoading();
            $.get('Task/GetTaskExtranetAttachments', { parentTaskNumber: self.parentTaskInfo.taskNumber }, function (data) {
                taskrow.HideLoading();
                if (!data.Success) {
                    UI.Alert(data.Message);
                    return false;
                }
                UI.ShowModalFromTemplateID('tmplSelectExistingExtranetAttachments', {}, options, function (modal) {
                    self.shareExtranetAttachmentViewModel = new ShareAttachmentViewModel(/*extranet*/ true);
                    self.shareExtranetAttachmentViewModel.RefreshData(data.Entity.Files, data.Entity.Images, data.Entity.Tasks);
                    ko.applyBindings(self.shareExtranetAttachmentViewModel, modal.element);
                    var onFilterChanges = function () {
                        UI.TriggerModalBodyResize();
                        $('#divExistingExtranetAttachmentsContent').jsScroll('refresh');
                    };
                    self.shareExtranetAttachmentViewModel.FilteredAttachments.subscribe(function (x) { return onFilterChanges(); });
                    self.shareExtranetAttachmentViewModel.FilteredImages.subscribe(function (x) { return onFilterChanges(); });
                    $('#divExistingExtranetAttachmentsContent').jsScroll();
                    UI.TriggerModalBodyResize();
                });
            });
        }).bind(this));
    };
    TaskDetail.prototype.SelectNewOwner = function (elem, user) {
        var self = this;
        if (user == null) {
            self.viewModel.SelectedTask.NewPost.NewOwner({});
        }
        //não seja criação de uma subtarefa && caso selecione o atual responsavel esta comentando a tarefa
        else if (self.viewModel.SelectedTask.NewPost.PostAction() != NewPostAction.ChildTask && user.UserID == self.viewModel.SelectedTask.TaskData().Owner.UserID) {
            self.BeginComment();
            self.ownerSearch.SetUsers([]);
        }
        //não seja criação de uma subtarefa && caso selecione o ultimo responsavel da tarefa e seja o atual responsavel, esta devolvendo a tarefa
        else if (self.viewModel.SelectedTask.NewPost.PostAction() != NewPostAction.ChildTask && user.UserID != environmentData.currentUserID && user.UserID == self.viewModel.SelectedTask.TaskData().LastForwardUser.UserID && self.viewModel.SelectedTask.TaskData().Owner.UserID == environmentData.currentUserID) {
            self.BeginAnswer();
            self.ownerSearch.SetUsers([]);
        }
        //quando criação de subtask com multiplo owner, pega o primeiro apenas para validação pois no servidor vai criar para cada usuario selecionado
        else if (self.viewModel.SelectedTask.NewPost.PostAction() == NewPostAction.ChildTask && self.viewModel.SelectedTask.NewPost.MultipleOwners()) {
            self.viewModel.SelectedTask.NewPost.NewOwner(user);
        }
        //esta encaminhando a tarefa
        else {
            self.viewModel.SelectedTask.NewPost.NewOwner(user);
            if (self.allocationControl != null)
                self.allocationControl.viewModel.SelectOwner(user.UserID, self.viewModel.SelectedTask.NewPost.NewDueDate());
        }
        this.ShowMultipleOwnerInvalid(false);
        this.RefreshRequestTypeListData();
        $('#frmSaveTaskItem')[0].clear();
        UI.TriggerModalBodyResize();
    };
    TaskDetail.prototype.SelectNewDueDate = function (elem, date) {
        var self = this;
        self.viewModel.SelectedTask.NewPost.setDueDate(date);
        if (date)
            $('#frmSaveTaskItem')[0].validator.element('#DueDate');
    };
    TaskDetail.prototype.ShowPostArea = function () {
        this.viewModel.SelectedTask.NewPost.FullPost(true);
        $('.new-task-item .new-owner, .new-task-item .same-owner, .new-task-item .last-owner').hide();
        $('.new-task-item').show(0, function () {
            this.ScrollToPostArea();
        }.bind(this));
        $('.btgPost').hide();
        $('.subtaskBtn').hide();
        this.SetupAttachment();
        this.SetupAttachmentFromExtranet();
        this.SetupRequestType();
        this.viewModel.SelectedTask.NewPost.setDueDate(this.viewModel.SelectedTask.TaskData().DueDate);
        this.viewModel.SelectedTask.NewPost.NewOwner({});
        if (this.allocationControl)
            this.allocationControl.viewModel.NewTaskTitle = this.viewModel.SelectedTask.TaskData().TaskTitle;
        this.CheckTimesheetStatus();
        setTimeout(function (self) {
            $("#newTaskItemComment").focus();
            if (self.viewModel.SelectedTask.TaskData()['ActualPermissions'].ChangeDueDate) {
                Tutorial.ShowNewPostOnce(function () {
                    $("#newTaskItemComment").focus();
                });
            }
            UI.TriggerModalBodyResize();
        }, 100, this);
    };
    TaskDetail.prototype.BeginAnswer = function () {
        this.viewModel.SelectedTask.NewPost.PostAction(NewPostAction.Answer);
        this.ShowPostArea();
        $('.new-task-item .last-owner').show();
        //$('#dueDateSelectorContainer').hide();
        this.viewModel.SelectedTask.NewPost.ForceLoadAllocation(false);
        $('#frmSaveTaskItem')[0].validator.element('#OwnerUserID');
        $('#frmSaveTaskItem')[0].validator.element('#DueDate');
        this.RefreshRequestTypeListData();
    };
    TaskDetail.prototype.ShowPostControls = function () {
        this.viewModel.SelectedTask.NewPost.HidePostControls(false);
        var timesheetOnApproval = (HeaderTimesheet.serverData != null && HeaderTimesheet.serverData.DayStatusID == TimesheetDayStatus.Approval);
        var invalidJob = (this.serverData.JobData.JobStatusID == EnumJobStatus.Blocked || this.serverData.JobData.JobStatusID == EnumJobStatus.Closed);
        if (!this.viewModel.RequiredTimesheet() || timesheetOnApproval || invalidJob)
            $('#SpentTime').val('0');
        else
            $('#SpentTime').val('');
        this.ResetTimesheetPickerText();
    };
    TaskDetail.prototype.BeginComment = function () {
        this.viewModel.SelectedTask.NewPost.PostAction(NewPostAction.Comment);
        this.ShowPostArea();
        $('.new-task-item .same-owner').show();
        //$('#dueDateSelectorContainer').hide();
        this.viewModel.SelectedTask.NewPost.ForceLoadAllocation(false);
        $('#frmSaveTaskItem')[0].validator.element('#OwnerUserID');
        $('#frmSaveTaskItem')[0].validator.element('#DueDate');
        if (this.viewModel.SelectedTask.TaskData().Closed)
            this.viewModel.ChangeStepFirst();
        //para comentários, não exibir controles e não obrigar timesheet
        this.viewModel.SelectedTask.NewPost.HidePostControls(true);
        if ($('#SpentTime').val() == '') {
            $('#SpentTime').val('0');
            this.ResetTimesheetPickerText();
        }
    };
    TaskDetail.prototype.ResetTimesheetPickerText = function () {
        if ($('#SpentTime').val() > 0)
            return;
        var time = $('#SpentTime').val();
        var $label = $('.timesheet_item_container .dateHourText');
        if (this.viewModel.RequiredTimesheet())
            $label.html((time == '' ? Resources.Task.FillTheSpentTime : time.toString()));
        else
            $label.html(Resources.Task.FillTheSpentTime);
    };
    TaskDetail.prototype.BeginForward = function () {
        if (!this.viewModel.SelectedTask.TaskData().ActualPermissions.CanForwardTask)
            return false;
        this.viewModel.SelectedTask.NewPost.PostAction(NewPostAction.Forward);
        this.ShowPostArea();
        $('.new-task-item .new-owner').show();
        var taskData = this.viewModel.SelectedTask.TaskData();
        this.viewModel.SelectedTask.NewPost.setDueDate(taskData.DueDate);
        this.viewModel.SelectedTask.NewPost.ForceLoadAllocation(false);
        if (this.viewModel.SelectedTask.TaskData().Closed)
            this.viewModel.ChangeStepFirst();
    };
    TaskDetail.prototype.BeginCloseChild = function () {
        if (this.viewModel.SelectedTask.TaskData().Closed)
            return false;
        this.viewModel.SelectedTask.NewPost.PostAction(NewPostAction.CloseChildTask);
        this.ShowPostArea();
        this.viewModel.SelectedTask.NewPost.ForceLoadAllocation(false);
        this.viewModel.ChangeStepLast();
    };
    TaskDetail.prototype.CheckTimesheetStatus = function () {
        if (!$('#SpentTime').data('time-selected')) {
            if (!this.viewModel.RequiredTimesheet())
                $('#SpentTime').val('0');
            else
                $('#SpentTime').val('');
            this.ResetTimesheetPickerText();
        }
        var removeTimesheetPicker = false;
        //caso já tenha enviado a timesheet do dia, não pode lançar mais horas
        var timesheetOnApproval = (HeaderTimesheet.serverData != null && HeaderTimesheet.serverData.DayStatusID == TimesheetDayStatus.Approval);
        if (timesheetOnApproval) {
            $('#SpentTime').val('0');
            $('#SpentTimeApproval_Info').show();
            removeTimesheetPicker = true;
        }
        var invalidJob = (this.serverData.JobData.JobStatusID == EnumJobStatus.Blocked || this.serverData.JobData.JobStatusID == EnumJobStatus.Closed);
        if (invalidJob) {
            $('#SpentTime').val('0');
            $('#SpentTimeApproval_Info_InvalidJob').show();
            removeTimesheetPicker = true;
        }
        if (removeTimesheetPicker && $('#SpentTime').attr('timesheetpicker_initialized')) {
            $('#SpentTime').timesheetpicker('remove');
            $('#SpentTime').removeAttr('timesheetpicker_initialized');
            $("#SpentTime").data('time-selected', false);
        }
    };
    TaskDetail.prototype.ShowMultipleOwnerInvalid = function (show) {
        if (show && ($('#subtaskOwnerInvalidMsg').length == 0)) {
            $('<span id="subtaskOwnerInvalidMsg">').text(Resources.Task.SubtaskOwnerInvalid).appendTo('#subtaskOwnerInvalid');
            $('#subtaskOwnerInvalid').addClass('field-validation-error').show();
        }
        else if (!show && $('#subtaskOwnerInvalidMsg').length > 0) {
            $('#subtaskOwnerInvalid').removeClass('field-validation-error').html('').hide();
        }
    };
    TaskDetail.prototype.PostFastComment = function () {
        if (this.waitingFastCommentReturn)
            return;
        if (this.viewModel.SelectedTask.NewPost.Comment().replace(/<[^>]+>/gi, '').trim() == '')
            return;
        if (this.viewModel.SelectedTask.NewPost.DueDateText() == '')
            this.viewModel.SelectedTask.NewPost.setDueDate(this.viewModel.SelectedTask.TaskData().DueDate);
        this.waitingFastCommentReturn = true;
        this.viewModel.SelectedTask.NewPost.Comment(Utils.ClearHTML(this.fastCommentArea.GetContent(), 'format-content-'));
        taskrow.DisplayLoading();
        $('#frmFastComment').submit();
    };
    TaskDetail.prototype.SavePost = function () {
        var self = this;
        var error = false;
        $('#btnSaveTaskItem').button('loading');
        this.refreshLastReadDate = true;
        var newPost = this.viewModel.SelectedTask.NewPost;
        var currentTaskData = this.viewModel.SelectedTask.TaskData();
        var multipleSubtask = newPost.PostAction() == NewPostAction.ChildTask && newPost.MultipleOwners();
        if (multipleSubtask && newPost.SubtasksOwnerList().length == 0) {
            self.ShowMultipleOwnerInvalid(true);
            error = true;
        }
        //quando for criar uma subtarefa, o request type é obrigatorio
        var subtaskInvalidRequestType = (newPost.PostAction() == NewPostAction.ChildTask && (!newPost.RequestTypeID() || newPost.RequestTypeID() <= 0));
        if (subtaskInvalidRequestType) {
            newPost.CreateSubtaskInvalidRequestType(subtaskInvalidRequestType);
            error = true;
        }
        //verifica o parametro da empresa para ver se o request type é obrigatorio quando criador vai encaminhar e é o atual responsavel da tarefa
        if (self.serverData.RequestTypeChangeRequiredParam) {
            var currentRequestType = _.findWhere(self.viewModel.RequestTypeList(), { 'RequestTypeID': currentTaskData.RequestTypeID });
            var invalidRequestType = (environmentData.currentUserID == currentTaskData.CreationUserID
                && currentTaskData.Owner.UserID == currentTaskData.CreationUserID
                && currentTaskData.Owner.UserID != newPost.ActualOwner().UserID
                && (currentRequestType == null || !currentRequestType.IsDefault) //quando o requestType atual da tarefa eh o Default, nao obriga uma nova seleção
                && (!newPost.RequestTypeID() || newPost.RequestTypeID() <= 0));
            if (invalidRequestType) {
                newPost.InvalidRequestType(invalidRequestType);
                error = true;
            }
        }
        if (newPost['NewDueDate']() == null)
            error = true;
        var frm = $('#frmSaveTaskItem');
        if (!frm.valid())
            error = true;
        if (error) {
            $('#btnSaveTaskItem').button('reset');
            Utils.ScrollToFirstErrorMessage();
            return false;
        }
        this.viewModel.SelectedTask.NewPost.Comment(Utils.ClearHTML(this.commentArea.GetContent(), 'format-content-'));
        setTimeout(function () {
            taskrow.DisplayLoading();
            frm.submit();
        }, 150);
    };
    TaskDetail.prototype.ShowError = function (message) {
        UI.Alert(message);
    };
    TaskDetail.prototype.SaveTaskItem_End = function (response) {
        var self = this;
        $('#btnSaveTaskItem').button('reset');
        taskrow.HideLoading();
        taskrow.currentModule.currentTask.waitingFastCommentReturn = false;
        if (response.status != 200) {
            UI.Alert(Resources.Task.ErrorOnSave);
            return;
        }
        var data = JSON.parse(response.responseText);
        var self2 = taskrow.currentModule.currentTask;
        var taskData = data.Entity;
        if (taskData) {
            self2.MergeTaskItems(taskData);
            self2.serverData.TaskData = taskData;
            self2.viewModel.SelectedTask.refreshData(taskData);
            if (taskData.TaskID == self2.viewModel.ParentTask.TaskID())
                self2.viewModel.refreshParentTask(taskData);
            self2.UpdateSiblingTask(taskData);
            self2.RefreshLoadedTask(taskData);
        }
        if (data.Success) {
            self2.ResetPostArea();
            self2.SetupSelectedTaskMembersPopover();
            self2.SetupSubtaskKeypress();
            self2.SetupApprovalsTaskAttachments();
            self2.SetupEffortEstimatePopover();
            self2.SetupRequestType();
            HeaderTimesheet.LoadTimesheetDayData();
        }
        if (data.Message)
            UI.Alert(data.Message);
        UI.TriggerModalBodyResize();
    };
    TaskDetail.prototype.MergeTaskItems = function (data) {
        var self = this;
        var taskLoaded = this.loadedTasks[data.TaskID];
        var items = taskLoaded.NewTaskItems;
        _.each(data.NewTaskItems, function (updatedItem) {
            var existingItem = _.findWhere(items, { 'TaskItemID': updatedItem.TaskItemID });
            if (existingItem) {
                updatedItem.Hide = ko.observable(true);
                updatedItem.CanHide = ko.observable(existingItem.Hide ? existingItem.Hide() : false);
                var index = _.indexOf(items, existingItem);
                items.splice(index, 1, updatedItem);
            }
            else {
                updatedItem.Hide = ko.observable(false);
                updatedItem.CanHide = ko.observable(false);
                items.push(updatedItem);
            }
        });
        data.NewTaskItems = items;
    };
    TaskDetail.prototype.LoadPreviousEffortEstimation = function (currentPost) {
        var peviousEffortEstimation = this.viewModel.SelectedTask.PreviousEffortEstimation();
        var previousEffortUnitListString = this.viewModel.SelectedTask.PreviousEffortUnitListString();
        //carrega valor setado no post
        if (currentPost === true) {
            peviousEffortEstimation = this.viewModel.SelectedTask.CurrentPostEffortEstimation();
            previousEffortUnitListString = this.viewModel.SelectedTask.CurrentPostEffortUnitListString();
        }
        $('#EffortEstimation').val(peviousEffortEstimation);
        $('#EffortUnitListString').val(previousEffortUnitListString);
        this.viewModel.SelectedTask.EffortEstimation(peviousEffortEstimation);
        this.viewModel.SelectedTask.EffortUnitListString(previousEffortUnitListString);
        this.viewModel.SelectedTask.TaskData().EffortEstimation = peviousEffortEstimation;
        this.viewModel.SelectedTask.TaskData().EffortUnitListString = previousEffortUnitListString;
    };
    TaskDetail.prototype.ResetPostArea = function (doNotSlideUp) {
        var self = this;
        if (!doNotSlideUp) {
            $('.new-task-item').hide(0, function () {
                self.SetupPostButtons(true);
            });
        }
        this.viewModel.SelectedTask.NewPost.reset();
        this.viewModel.SelectedTask.NewPost.NotificationUsers.removeAll();
        this.viewModel.SelectedTask.NewPost.SubtasksOwnerList.removeAll();
        this.viewModel.SelectedTask.NewPost.SubtasksCopyTaskAttachments.removeAll();
        this.viewModel.SelectedTask.NewPost.ExistingTaskAttachments.removeAll();
        this.viewModel.SelectedTask.NewPost.ExistingAttachments.removeAll();
        //reset user search
        if (this.ownerSearch)
            this.ownerSearch.Reset();
        if (this.notifyUserSearch)
            this.notifyUserSearch.Reset();
        if (this.subtasksOwnerSearch)
            this.subtasksOwnerSearch.Reset();
        if (this.allocationControl != null)
            this.allocationControl.Reset();
        if (this.attachmentControl)
            this.attachmentControl.Reset();
        //RESET EFFORT ESTIMATION
        this.LoadPreviousEffortEstimation();
        this.viewModel.SelectedTask.CurrentPostEffortEstimation(null);
        this.viewModel.SelectedTask.CurrentPostEffortUnitListString(null);
        var timesheetOnApproval = (HeaderTimesheet.serverData != null && HeaderTimesheet.serverData.DayStatusID == TimesheetDayStatus.Approval);
        var invalidJob = (this.serverData.JobData.JobStatusID == EnumJobStatus.Blocked || this.serverData.JobData.JobStatusID == EnumJobStatus.Closed);
        if (!this.viewModel.RequiredTimesheet() || timesheetOnApproval || invalidJob)
            $('#SpentTime').val('0');
        else
            $('#SpentTime').val('');
        if ($('#SpentTime').attr('timesheetpicker_initialized')) {
            $('#SpentTime').timesheetpicker('reset');
            $("#SpentTime").data('time-selected', false);
        }
        $('#newTaskItemComment').html('');
        $('#fastCommentArea').html('');
        $('#spanClearFastComment').css('visibility', 'hidden');
        $('#fastCommentPlaceHolder').css('display', '');
        $('#btnSaveTaskItem').button('reset');
        $('#frmSaveTaskItem')[0].clear();
        this.viewModel.SelectedTask.NewPost.FullPost(false);
    };
    TaskDetail.prototype.CloseTask = function () {
        var self = this;
        var data = this.viewModel.SelectedTask.TaskData();
        var jobData = this.viewModel.Job();
        taskrow.DisplayLoading();
        var failCallback = function (response) {
            taskrow.HideLoading();
            UI.Alert(response.Message);
            return false;
        };
        var successCallback = function (response) {
            if (response.Success === false) {
                return failCallback(response);
            }
            self.ReloadTask();
            taskrow.HideLoading();
        };
        $.ajax({ url: '/Task/UpdateTaskHeader', data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, close: true, newDueDate: $M(data.DueDate).format("YYYY-MM-DD") }, method: 'post' })
            .fail(failCallback)
            .done(successCallback);
    };
    TaskDetail.prototype.ReopenTask = function () {
        var self = this;
        var callback = function (modal, duedate) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message, null, null, null, true);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/UpdateTaskHeader', data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, close: false, newDueDate: duedate.format("YYYY-MM-DD") }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ReopenTask, callback);
    };
    TaskDetail.prototype.ChangeDueDate = function () {
        var self = this;
        var callback = function (modal, duedate, duedateToSubtasks) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                var task = response.Entity;
                modal.close();
                self.ReloadTask();
                self.changeDueDateViewModel = null;
                self.changeDueDateAllocationControl = null;
                if (self.ownerSearch != null)
                    self.ownerSearch.dueDate = $M(task.DueDate);
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/UpdateTaskHeader', data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, close: false, newDueDate: duedate.format("YYYY-MM-DD"), duedateToSubtasks: duedateToSubtasks }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeDueDate, callback);
    };
    TaskDetail.prototype.ChangeDueDateOrder = function () {
        var self = this;
        var callback = function (modal, orderTaskNumbers) {
            if (!orderTaskNumbers || orderTaskNumbers.length <= 1) {
                modal.close();
                return false;
            }
            var data = self.viewModel.SelectedTask.TaskData();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                self.changeDueDateOrderViewModel = null;
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/ChangeMultipleDueDateOrder', data: { taskNumber: data.TaskNumber, orderTaskNumbers: orderTaskNumbers }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeDueDateOrder, callback);
    };
    TaskDetail.prototype.ChangeTitle = function () {
        var self = this;
        var callback = function (modal, duedate, title, tags) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            $('#btnSaveTaskHeader').button('loading');
            taskrow.DisplayLoading();
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/ChangeTitleAndTags', traditional: true, data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, title: title.replace(/<[^>]+>/gi, ''), tags: tags, connectionID: SignalrHub.MainHub.connection.id }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeTitle, callback);
    };
    TaskDetail.prototype.ChangeMembers = function () {
        var self = this;
        var callback = function (modal, duedate, title, tags, members) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/ChangeMembers', traditional: true, data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, memberListString: _.pluck(members, 'UserID').join(',') }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeMembers, callback);
    };
    TaskDetail.prototype.SetupEffortEstimatePopover = function () {
        this.remainingEffortPopoverElement = $('.task-header-data .task-change-effort');
        if (!this.remainingEffortPopoverElement || this.remainingEffortPopoverElement.length == 0)
            return;
        try {
            if ($(this.remainingEffortPopoverElement).attr('haspopover')) {
                $(this.remainingEffortPopoverElement).off('shown').off('shown.bs.popover');
                $(this.remainingEffortPopoverElement).popover('destroy');
                $(this.remainingEffortPopoverElement).removeAttr('haspopover');
            }
        }
        catch (e) {
        }
        var popoverID = 'popoverBody_remainingEffortPopover_' + this.selectedTaskInfo.taskNumber;
        var callbackFn = function () {
            Utils.SetupHidePopover(this.remainingEffortPopoverElement[0], popoverID);
        }.bind(this);
        $(this.remainingEffortPopoverElement).attr('haspopover', true);
        $(this.remainingEffortPopoverElement).popover({
            html: true,
            container: '.task-details',
            autoHide: true,
            title: Utils.FormatTitlePopover(this.remainingEffortPopoverElement[0], Resources.Task.EffortEstimation, true),
            placement: 'bottom',
            content: function () {
                var content = $('<div class="row-fluid info-popover task-effort-popover">').attr('id', popoverID);
                var ul = $('<ul>');
                //esforço restante
                {
                    var remainingEffort = Utils.MinuteToDays(this.serverData.TaskData.RemainingEffortEstimation || 0, true);
                    var li = $('<li>').addClass('effort');
                    var span = $('<span><b>' + Resources.Task.RemainingEffort + ':</b> ' + remainingEffort + '</span>');
                    span.appendTo(li);
                    if (this.viewModel.SelectedTask.TaskData().ActualPermissions.ChangeEffortEstimation ||
                        this.viewModel.SelectedTask.TaskData().Owner.UserID == environmentData.currentUserID) {
                        this.remainingEffortTimesheetpicker = $('<div>').addClass('timesheetpicker');
                        $('<div>').attr('id', 'remaining-effort-timesheetpicker').appendTo(this.remainingEffortTimesheetpicker);
                        $('<input>').attr('type', 'hidden').attr('id', 'newRemainingEffort').appendTo(this.remainingEffortTimesheetpicker);
                        $('<button>')
                            .addClass('btn btn-mini')
                            .attr('style', 'margin-right: 2px;')
                            .text(Resources.Commons.Cancel)
                            .on('click', function () {
                            this.remainingEffortTimesheetpicker.hide();
                            $('#remaining-effort-timesheetpicker', this.remainingEffortTimesheetpicker).timesheetpicker('reset');
                        }.bind(this))
                            .appendTo(this.remainingEffortTimesheetpicker);
                        $('<button>')
                            .attr('id', 'btnSaveRemainingEffortPopover')
                            .attr('data-loading-text', Resources.Commons.Saving)
                            .attr('style', 'opacity: 0.2;')
                            .attr('disabled', 'disabled')
                            .addClass('btn btn-mini btn-primary')
                            .text(Resources.Commons.Save)
                            .on('click', function () {
                            var newRemainingEffort = +$('#newRemainingEffort').val();
                            if (newRemainingEffort > 0 && newRemainingEffort != this.serverData.TaskData.RemainingEffortEstimation) {
                                $('#btnSaveRemainingEffortPopover').button('loading');
                                this.SaveRemainingEffortEstimation.call(this, newRemainingEffort, function (sucess) {
                                    $('#btnSaveRemainingEffortPopover').button('reset');
                                    if (sucess)
                                        this.remainingEffortPopoverElement.popover('hide');
                                }.bind(this));
                            }
                        }.bind(this))
                            .appendTo(this.remainingEffortTimesheetpicker);
                        var editBtn = $('<a class="edit"><i class="icon icon-edit"></i></a>');
                        editBtn.off('click').on('click', function () {
                            $('#remaining-effort-timesheetpicker', this.remainingEffortTimesheetpicker).timesheetpicker('reset');
                            this.remainingEffortTimesheetpicker.toggle();
                        }.bind(this));
                        editBtn.appendTo(span);
                        this.remainingEffortTimesheetpicker.appendTo(li);
                    }
                    li.appendTo(ul);
                }
                //esforço original
                {
                    var originalEffort = Utils.MinuteToDays(this.serverData.TaskData.EffortEstimation || 0, true);
                    var li = $('<li>').addClass('effort');
                    var span = $('<span><b>' + Resources.Task.OriginalEffort + ':</b> ' + originalEffort + '</span>');
                    if (this.viewModel.SelectedTask.TaskData().ActualPermissions.ChangeEffortEstimation) {
                        var editBtn = $('<a class="edit"><i class="icon icon-edit"></i></a>');
                        editBtn.off('click').on('click', function () {
                            this.ChangeEffortEstimation();
                            this.remainingEffortPopoverElement.popover('hide');
                        }.bind(this));
                        editBtn.appendTo(span);
                    }
                    span.appendTo(li);
                    li.appendTo(ul);
                }
                var subtasks = _.pluck(_.filter(this.serverData.TaskData.Subtasks, function (x) { return x.ChildTask && !x.ChildTask.Closed; }), 'ChildTask');
                if (subtasks.length > 0) {
                    $('<li>').addClass('divider').appendTo(ul);
                    $('<li>').addClass('nav-header').attr('style', 'padding: 3px 0;').text(Resources.Task.Subtasks).appendTo(ul);
                    _.each(subtasks, function (subtask) {
                        var subRemaininEffort = subtask.RemainingEffortEstimation > 0 ? Utils.MinuteToDays(subtask.RemainingEffortEstimation, true) : '-';
                        var subOriginalEffort = subtask.EffortEstimation > 0 ? Utils.MinuteToDays(subtask.EffortEstimation, true) : '-';
                        var subLi = $('<li style="line-height: 18px; margin-bottom: 10px!important;">').addClass('effort');
                        $('<span style="display: block;"><b>#' + subtask.TaskNumber + ' ' + subtask.TaskTitle + ':</b></span>').appendTo(subLi);
                        $('<span style="display: block; margin-left: 10px; font-size: 12px; text-transform: lowercase;">' + Resources.Task.Original + ': ' + subOriginalEffort + '</span>').appendTo(subLi);
                        $('<span style="display: block; margin-left: 10px; font-size: 12px; text-transform: lowercase;">' + Resources.Task.Remaining + ': ' + subRemaininEffort + '</span>').appendTo(subLi);
                        subLi.appendTo(ul);
                    }.bind(this));
                }
                var listContainer = $('<div class="span12 col-md-12">');
                ul.appendTo(listContainer);
                listContainer.appendTo(content);
                return content;
            }.bind(this),
            callback: function () {
                var timeList = [].concat(_.range(8).map(function (x) { return x * 15; }), _.range(8).map(function (x) { return (8 * 15) + x * 30; }), _.range(34).map(function (x) { return (12 * 30) + x * 60; }), _.range(31).map(function (x) { return (40 * 60) + x * 240; }));
                $('#remaining-effort-timesheetpicker', this.remainingEffortTimesheetpicker).timesheetpicker({
                    buttonSize: 'small',
                    containerClass: 'absolute',
                    displayClass: 'btn pull-left',
                    mode: EnumTimepickerMode.Hours,
                    timeList: timeList,
                    openStart: true,
                    keepEditMode: true,
                    currentUsedTime: this.serverData.TaskData.RemainingEffortEstimation || undefined,
                    displayCurrentTime: this.serverData.TaskData.RemainingEffortEstimation ? Utils.FormatMinutes(this.serverData.TaskData.RemainingEffortEstimation) : undefined,
                    setTimecallback: function (minutesSpent) {
                        $('#newRemainingEffort').val(minutesSpent);
                        if (minutesSpent != '')
                            $('#btnSaveRemainingEffortPopover').removeAttr('disabled').attr('style', 'opacity: 1;');
                        else
                            $('#btnSaveRemainingEffortPopover').attr('disabled', 'disabled').attr('style', 'opacity: 0.2;');
                    }.bind(this)
                });
            }.bind(this)
        })
            .off('shown', callbackFn).on('shown', callbackFn)
            .off('shown.bs.popover', callbackFn).on('shown.bs.popover', callbackFn)
            .addListener('click', function (e) { e.stopPropagation(); });
    };
    TaskDetail.prototype.SaveRemainingEffortEstimation = function (remainingEffort, callback) {
        var self = this;
        var data = this.viewModel.SelectedTask.TaskData();
        var failCallback = function (response) {
            taskrow.HideLoading();
            UI.Alert(response.Message);
            if (callback)
                callback.call(self, false);
            return false;
        };
        var successCallback = function (response) {
            if (response.Success === false) {
                return failCallback(response);
            }
            self.ReloadTask();
            taskrow.HideLoading();
            if (callback)
                callback.call(self, true);
        };
        taskrow.DisplayLoading();
        $.ajax({ url: '/Task/ChangeRemainingEffortEstimation', data: { taskNumber: data.TaskNumber, rowVersion: data.RowVersion, remainingEffort: remainingEffort }, method: 'post' })
            .fail(failCallback)
            .done(successCallback);
    };
    TaskDetail.prototype.ChangeRemainingEffortEstimation = function () {
        var self = this;
        var callback = function (modal, duedate, title, tags, members, remainingEffort) {
            $('#btnSaveTaskHeader').button('loading');
            self.SaveRemainingEffortEstimation.call(self, remainingEffort, function (sucess) {
                $('#btnSaveTaskHeader').button('reset');
                if (sucess)
                    modal.close();
            });
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeRemainingEffortEstimation, callback, $.noop);
    };
    TaskDetail.prototype.ChangeEffortEstimation = function () {
        var self = this;
        var callback = function (modal, duedate, title, tags, members, effortEstimation, effortUnitListString) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/UpdateTaskHeader', data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, close: false, newDueDate: $M(data.DueDate).format("YYYY-MM-DD"), changeEffortEstimation: true, effortEstimation: effortEstimation, effortUnitListString: effortUnitListString }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.LoadPreviousEffortEstimation();
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeEffortEstimation, callback, function () {
            self.LoadPreviousEffortEstimation(true);
        });
    };
    TaskDetail.prototype.ChangeRequestContact = function () {
        var self = this;
        var callback = function (modal, duedate, title, tags, members, effortEstimation, effortUnitListString, requestContactID) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/UpdateTaskHeader', data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, close: false, newDueDate: $M(data.DueDate).format("YYYY-MM-DD"), effortEstimation: effortEstimation, effortUnitListString: effortUnitListString, requestContactID: requestContactID }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeRequestContact, callback);
    };
    TaskDetail.prototype.ChangeDeliverable = function () {
        var self = this;
        var callback = function (modal, duedate, title, tags, members, effortEstimation, effortUnitListString, requestContactID, deliverableID) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/UpdateTaskHeader', data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, close: false, newDueDate: $M(data.DueDate).format("YYYY-MM-DD"), effortEstimation: effortEstimation, effortUnitListString: effortUnitListString, requestContactID: requestContactID, deliverableID: deliverableID }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeDeliverable, callback);
    };
    TaskDetail.prototype.UpdatePipelineStep = function (pipelineStepID) {
        var self = this;
        var data = this.viewModel.SelectedTask.TaskData();
        if (data.PipelineStepID == pipelineStepID) {
            console.log('ignorar ação - mesmo pipeline');
            return;
        }
        var jobData = this.viewModel.Job();
        taskrow.DisplayLoading();
        var failCallback = function (response) {
            taskrow.HideLoading();
            UI.Alert(response.Message);
            return false;
        };
        var successCallback = function (response) {
            if (response.Success === false) {
                return failCallback(response);
            }
            self.ReloadTask();
            taskrow.HideLoading();
        };
        $.post('/Task/UpdatePipelineStep', { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, pipelineStepID: pipelineStepID, close: false })
            .fail(failCallback)
            .done(successCallback);
    };
    TaskDetail.prototype.UpdateExtranetPipelineStep = function (extranetPipelineStepID) {
        var self = this;
        var data = this.viewModel.SelectedTask.TaskData();
        if (data.ExtranetPipelineStepID == extranetPipelineStepID) {
            console.log('ignorar ação - mesmo pipeline');
            return;
        }
        //não permite alterar extranet pipeline com a tarefa fechada
        if (data.Closed || data.ExtranetClosed)
            return;
        var jobData = this.viewModel.Job();
        taskrow.DisplayLoading();
        var failCallback = function (response) {
            taskrow.HideLoading();
            UI.Alert(response.Message);
            return false;
        };
        var successCallback = function (response) {
            if (response.Success === false) {
                return failCallback(response);
            }
            self.ReloadTask(null, true);
            taskrow.HideLoading();
        };
        var toClientContactID = 0;
        var lastContact = _(this.serverData.TaskData.ExternalTaskItems).chain().pluck('FromContact').compact().last().value();
        if (!lastContact)
            lastContact = _(this.serverData.TaskData.ExternalTaskItems).chain().pluck('ToContact').compact().last().value();
        if (lastContact)
            toClientContactID = lastContact['ClientContactID'];
        $.post('/Task/UpdateExtranetPipelineStep', { taskNumber: data.TaskNumber, toClientContactID: toClientContactID, extranetPipelineStepID: extranetPipelineStepID, connectionID: $.connection.hub.id })
            .fail(failCallback)
            .done(successCallback);
    };
    TaskDetail.prototype.ChangeExtranetMembers = function () {
        var self = this;
        //não permite alterar membros com a tarefa fechada
        if (this.viewModel.SelectedTask.TaskData().Closed || this.viewModel.SelectedTask.TaskData().ExtranetClosed)
            return;
        var callback = function (modal, externalMembers) {
            var data = self.viewModel.SelectedTask.TaskData();
            var jobData = self.viewModel.Job();
            taskrow.DisplayLoading();
            $('#btnSaveTaskHeader').button('loading');
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                modal.close();
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                modal.close();
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            var toClientContactID = self.viewModel.NewExternalTaskItem.ToClientContactID();
            var clientContacts = _.pluck(externalMembers, 'ClientContactID');
            if (!clientContacts || clientContacts.length == 0) {
                $('#spnExtranetMembersInvalid').show();
                $('#btnSaveTaskHeader').button('reset');
                return false;
            }
            $('#spnExtranetMembersInvalid').hide();
            $.ajax({ url: '/Task/UpdateExtranetExternalMembers', data: Utils.ToParams({ taskNumber: data.TaskNumber, toClientContactID: toClientContactID, clientContacts: clientContacts, connectionID: $.connection.hub.id }), method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeExtranetMembers, callback);
    };
    TaskDetail.prototype.SetEffortEstimation = function () {
        var self = this;
        var callback = function (modal, duedate, title, tags, members, effortEstimation, effortUnitListString) {
            $('#EffortEstimation').val(effortEstimation);
            $('#EffortUnitListString').val(effortUnitListString);
            self.viewModel.SelectedTask.EffortEstimation(effortEstimation);
            self.viewModel.SelectedTask.EffortUnitListString(effortUnitListString);
            //self.viewModel.SelectedTask.SubtaskEffortInitialState(false);
            self.viewModel.SelectedTask.TaskData().EffortEstimation = effortEstimation;
            self.viewModel.SelectedTask.TaskData().EffortUnitListString = effortUnitListString;
            $('#btnSaveTaskHeader').button('reset');
            modal.close();
            self.viewModel.SelectedTask.CurrentPostEffortEstimation(effortEstimation);
            self.viewModel.SelectedTask.CurrentPostEffortUnitListString(effortUnitListString);
            if (self.viewModel.SelectedTask.NewPost.PostAction() == NewPostAction.ChildTask && self.viewModel.SelectedTask.NewPost.MultipleOwners()) {
                _.each(self.viewModel.SelectedTask.NewPost.SubtasksOwnerList(), function (sub) {
                    sub.EffortEstimation(effortEstimation);
                    sub.EffortUnitListString(effortUnitListString);
                });
            }
        };
        self.ShowTaskHeaderDialog(this.TASK_HEADER_SCENARIO.ChangeEffortEstimation, callback);
    };
    TaskDetail.prototype.LoadSubtaskEffortEstimation = function (subtask) {
        var self = this;
        if (!subtask)
            return;
        this.changeEffortestimationViewModel = new EditEffortEstimationViewModel();
        var timepickerMode = EnumTimepickerMode.Hours;
        var estimation = subtask.EffortEstimation();
        var effortUnitListString = subtask.EffortUnitListString();
        if (estimation >= 480 && estimation % 480 == 0) {
            timepickerMode = EnumTimepickerMode.Days;
        }
        this.changeEffortestimationViewModel.SelectedEffortEstimationType(timepickerMode);
        this.changeEffortestimationViewModel.EffortEstimation(estimation);
        this.changeEffortestimationViewModel.EffortUnitListString(effortUnitListString);
    };
    TaskDetail.prototype.SetSubtaskEffortEstimation = function (subtask) {
        var self = this;
        var callback = function (modal, effortEstimation, effortUnitListString) {
            subtask.EffortEstimation(effortEstimation);
            subtask.EffortUnitListString(effortUnitListString);
            modal.close();
        };
        var dialogData = {};
        var fnAfterShow = function (modal) {
            self.changeEffortestimationViewModel = null;
            self.LoadSubtaskEffortEstimation(subtask);
            ko.applyBindings(self.changeEffortestimationViewModel, $('#taskHeaderUpdate')[0]);
            self.SetupEffortEstimation();
            self.ToggleEffortTimepicker(self.changeEffortestimationViewModel.SelectedEffortEstimationType());
        };
        var dialogOptions = new ModalWindowOptions();
        dialogData.changeEffortEstimation = true;
        dialogOptions.title = Resources.Task.ChangeEffortEstimation;
        dialogOptions.style = 'width: 680px';
        var btnSave = new ModalButton();
        btnSave.isPrimary = true;
        btnSave.id = "btnSaveSubtaskEffortEstimation";
        btnSave.label = Resources.Commons.Save;
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.action = function (e, modal) {
            var effortEstimation = $('#taskHeaderUpdate #EffortEstimation').val();
            var effortUnitListString = $('#taskHeaderUpdate #EffortUnitListString').val();
            $('#txtMessage').html('');
            if (callback)
                callback(modal, effortEstimation, effortUnitListString);
        };
        var btnCancel = new ModalButton();
        btnCancel.label = Resources.Commons.Cancel;
        btnCancel.action = function (e, modal) {
            modal.close();
        };
        dialogOptions.closeButton = false;
        dialogOptions.buttons.push(btnSave);
        dialogOptions.buttons.push(btnCancel);
        dialogOptions.onClose = function (e, modal) {
            Utils.CleanNode($('#taskHeaderUpdate')[0]);
        };
        UI.ShowModal(taskrow.templatePath + 'Task/TaskHeader', dialogData, dialogOptions, fnAfterShow);
    };
    TaskDetail.prototype.GetDateFormatForDatePicker = function () {
        return 'dd/mm/yyyy';
    };
    TaskDetail.prototype.GetDateFormatForMoment = function () {
        return 'DD/MM/YYYY';
    };
    TaskDetail.prototype.SetupSelectedTaskMembersPopover = function () {
        var self = this;
        var members = self.viewModel.SelectedTask.TaskData().Members;
        var ownerUserID = self.viewModel.SelectedTask.TaskData().Owner.UserID;
        //quando possui apenas um, eh o owner e nao conta como participante
        if (members.length == 1 && members[0].UserID == ownerUserID)
            return null;
        if ($('#task-members').length > 0)
            Utils.SetupMembersPopover($('#task-members')[0], members, ownerUserID, true);
    };
    TaskDetail.prototype.SetupSelectedTaskExternalMembersPopover = function () {
        var self = this;
        var members = _.map(self.viewModel.SelectedTask.TaskData()['ExternalMembers'], function (x) {
            return _.extend(x.Contact, { Read: x.Read, LastReadDate: x.LastReadDate });
        });
        if (members.length > 0 && $('#task-external-members').length > 0)
            Utils.SetupExternalMembersPopover($('#task-external-members')[0], members, true, Resources.Task.ExternalMembers, true);
    };
    TaskDetail.prototype.SetupDeliverablesPopover = function () {
        if ($('.deliverableName').length > 0)
            $('.deliverableDetails').css('left', ($('.deliverableName')[0].offsetLeft) + 'px');
    };
    TaskDetail.prototype.SetupExtranetTab = function () {
        var _this = this;
        var self = this;
        if (this.extranetTabDone) {
            //marcar como lida caso tenha pendencia, mesmo se aba extranet já estiver sido "pré carregada"
            if (this.viewModel.SelectedTask.ExtranetPending())
                this.MarkTaskExtranetAsRead();
            return;
        }
        this.extranetTabDone = true;
        var clientID = this.serverData.JobData.Client.ClientID;
        this.viewModel.NewExternalTaskItem.TaskNumber(this.parentTaskInfo.taskNumber);
        this.viewModel.NewExternalTaskItem.MemberContacts(_(this.serverData.TaskData.ExternalMembers).pluck('Contact'));
        this.SetupExtranetAttachment();
        this.SetupApprovalsPopover();
        this.MarkTaskExtranetAsRead();
        this.SetupExtranetActions();
        //DeleteUnsentAttachment
        //ToggleRenameAttachments
        $(this.viewModel.NewExternalTaskItem).unbind('taskrow:rename').bind('taskrow:rename', function (e, guid, element) { _this.extranetAttachmentControl.ToggleRenameAttachments(guid); });
        $(this.viewModel.NewExternalTaskItem).unbind('taskrow:rename').bind('taskrow:delete', function (e, guid, element) { _this.extranetAttachmentControl.DeleteUnsentAttachment(guid, element); });
        self.externalTaskItemCommentArea = new FormatContent($('#newExternalTaskItemComment')[0], $('#newExternalTaskItemFormatButtons')[0]);
        self.externalTaskItemCommentArea.focusCallback = function () { };
        self.externalTaskItemCommentArea.changeValueCallback = function (value) {
            setTimeout(function () {
                $('*[data-bind]', "#newExternalTaskItemComment").each(function (index, item) {
                    $(item).removeAttr('data-bind');
                });
                var taskComment = self.externalTaskItemCommentArea.GetContent();
                taskComment = Utils.ClearHTML(taskComment);
                self.viewModel.NewExternalTaskItem.Comment(taskComment);
            }, 100);
        };
        $('#newExternalTaskItemComment')[0].innerHTML = '';
        self.externalTaskItemCommentArea.Init();
        $.get('/Client/ListClientContactsForExtranet', { clientID: clientID }, (function (data) {
            if (data.length == 0) {
                self.viewModel.NoContacts(true);
                $('#divExtranetWithoutUsers').show();
                $('#divExternalTaskItems').hide();
            }
            self.extranetContactsToSearch = data;
            //searchClientContactMembers
            self.notifyClientContactSearch = new ClientContactSearch({ searchBox: $('#searchClientContactMembers')[0], mode: ClientContactSearchMode.Single, renderContacts: false, initialContacts: [], contactsToSearch: self.extranetContactsToSearch });
            self.notifyClientContactSearch.selectContactCallback = function (contact) {
                $('#spnContactMembersInvalid').hide();
                if (!_.any(self.viewModel.NewExternalTaskItem.NotifyContacts(), function (x) { return x.ClientContactID == contact.ClientContactID; })) {
                    self.viewModel.NewExternalTaskItem.NotifyContacts.push(contact);
                }
            };
            self.notifyClientContactSearch.Init();
        }).bind(this));
        setTimeout(function () {
            this.SetupHideExternalTaskAttachments();
        }.bind(this), 10);
    };
    TaskDetail.prototype.SetupExtranetActions = function () {
        var _this = this;
        //Não permite solicitação nem comentario em solicitação encerrada
        if (!this.viewModel.SelectedTask.TaskData().ExtranetClosed) {
            $('#btnNewExternalItem').unbind('click').bind('click', function (e) {
                $('#newExternalTaskItem').show();
                $('#extranetActionButtons').hide();
                setTimeout(function () {
                    $('#newExternalTaskItemComment').focus();
                }, 10);
            });
            //Não permite solicitação de aprovação caso tenha sido solicitado o encerramento
            if (!this.viewModel.SelectedTask.TaskData().ExtranetCloseRequested) {
                $('#btnRequestApproval').bind('click', function (e) {
                    $('#newExternalTaskItem').show();
                    $('#extranetActionButtons').hide();
                    _this.viewModel.NewExternalTaskItem.RequireApproval(true);
                    setTimeout(function () {
                        $('#newExternalTaskItemComment').focus();
                    }, 10);
                });
            }
            else {
                $('#btnRequestApproval').unbind('click');
            }
        }
        else {
            $('#btnNewExternalItem').unbind('click');
            $('#btnRequestApproval').unbind('click');
        }
    };
    TaskDetail.prototype.SetupExtranetAttachment = function () {
        var self = this;
        $('#btnSelectMainTaskAttachment').off('click').on('click', (function () {
            var _this = this;
            var options = UI.CreateSaveCancelModalOptions(Resources.Task.SelectExistingAttachment, function (event, modal) {
                var element = modal.element;
                var ids = self.currentShareAttachmentViewModel.SelectedAttachmentsIDs();
                var attachments = self.currentShareAttachmentViewModel.AllAttachments().filter(function (x) { return ids.indexOf(x.TaskAttachmentID) >= 0; }).concat(self.currentShareAttachmentViewModel.AllImages().filter(function (x) { return ids.indexOf(x.TaskAttachmentID) >= 0; }));
                attachments = _.map(attachments, function (attachment) {
                    return _.extend(attachment, { Name: (attachment.Name.lastIndexOf('.') > -1) ? attachment.Name.substring(0, attachment.Name.lastIndexOf('.')) : attachment.Name });
                }, _this);
                self.viewModel.NewExternalTaskItem.InternalTaskAttachments(attachments);
                //InternalTaskAttachments
                modal.close();
            });
            options.onClose = function () {
                self.currentShareAttachmentViewModel = null;
            };
            options.style = 'width: 850px';
            taskrow.DisplayLoading();
            $.get('Task/GetTaskAttachments', { parentTaskNumber: self.parentTaskInfo.taskNumber }, function (data) {
                taskrow.HideLoading();
                if (!data.Success) {
                    UI.Alert(data.Message);
                    return false;
                }
                UI.ShowModalFromTemplateID('tmplSelectExistingAttachment', {}, options, function (modal) {
                    self.currentShareAttachmentViewModel = new ShareAttachmentViewModel();
                    self.currentShareAttachmentViewModel.RefreshData(data.Entity.Files, data.Entity.Images, data.Entity.Tasks);
                    ko.applyBindings(self.currentShareAttachmentViewModel, modal.element);
                    var onFilterChanges = function () {
                        UI.TriggerModalBodyResize();
                        $('#divExistingAttachmentsContent').jsScroll('refresh');
                    };
                    self.currentShareAttachmentViewModel.FilteredAttachments.subscribe(function (x) { return onFilterChanges(); });
                    self.currentShareAttachmentViewModel.FilteredImages.subscribe(function (x) { return onFilterChanges(); });
                    $('#divExistingAttachmentsContent').jsScroll();
                    UI.TriggerModalBodyResize();
                });
            });
        }).bind(this));
        if (!self.extranetAttachmentControl) {
            require(['Scripts/Plugins/AttachmentControl'], function () {
                self.extranetAttachmentControl = new AttachmentControl({
                    contextName: 'extranetTask',
                    attachmentContainer: $('#newExternalTaskItemComment')[0],
                    buttonSave: [$('#btnSaveExternalTask')[0]],
                    btnAddAttachment: $('#btnAddExtranetAttachment'),
                    dropAreaSettings: {
                        maxFileSize: 1024 * 1024 * 100,
                        maxTotalSize: 1024 * 1024 * 100,
                    },
                    addAttachmentCallback: function (fileData) {
                        var attachmentData = {
                            Identification: fileData.GUID,
                            Name: fileData.fullName,
                            NewAttachmentName: fileData.name,
                            MimeType: fileData.type,
                            AttachmentTypeID: fileData.AttachmentTypeID,
                            MaxProgressBar: fileData.maxProgressBar,
                            Complete: false
                        };
                        self.viewModel.NewExternalTaskItem.AddAttachment(attachmentData);
                    },
                    removeNewAttachmentCallback: function (guid) {
                        self.viewModel.NewExternalTaskItem.RemoveAttachment(guid);
                    },
                    templateProvider: taskrow,
                    moduleContainer: taskrow
                });
                self.extranetAttachmentControl.Init();
            });
        }
        else {
            self.extranetAttachmentControl.ReloadControl($('#newExternalTaskItemComment')[0]);
        }
    };
    TaskDetail.prototype.SetupApprovalsPopover = function () {
        //#region Popover comentário reprovação de anexo
        var reprovedCommentedAttachments = _.filter(this.serverData.TaskData.ExternalAttachments, function (x) {
            return x.ApprovalRequestItem != null
                && x.ApprovalRequestItem.ApprovalRequestStatusID == EnumApprovalRequestStatus.Reproved
                && (x.ApprovalRequestItem.Comment || '') != '';
        });
        _.each(reprovedCommentedAttachments, function (attachment) {
            var commentElements = $('li[attachmentid=' + attachment.AttachmentID + '] > button.commented');
            _.each(commentElements, function (element) {
                try {
                    if ($(element).attr('haspopover')) {
                        $(element).off('shown').off('shown.bs.popover');
                        $(element).popover('destroy');
                        $(element).removeAttr('haspopover');
                    }
                }
                catch (e) {
                }
                var popoverID = 'popoverBody_' + element.id;
                var callbackFn = function () {
                    $('button.commented').not(element).popover('hide');
                    Utils.SetupHidePopover(element, popoverID);
                };
                $(element).attr('haspopover', true);
                $(element).popover({
                    html: true,
                    container: '.task-details',
                    autoHide: true,
                    title: Utils.FormatTitlePopover(element, 'Reprovação', true),
                    placement: 'bottom',
                    content: function () {
                        var content = $('<div class="row-fluid info-popover attachment-reproved-popover">').attr('id', popoverID);
                        var ul = $('<ul>');
                        //approval info
                        $('<li><span><b>' + Resources.TaskAttachment.Attachment + ':</b> ' + attachment.Name + '</span><li>').appendTo(ul);
                        var commentLi = $('<li>');
                        var span = $('<span>').html('<b>' + Resources.Commons.Comment + ':</b> ' + attachment.ApprovalRequestItem.Comment);
                        span.appendTo(commentLi);
                        commentLi.appendTo(ul);
                        var listContainer = $('<div class="span12 col-md-12">');
                        ul.appendTo(listContainer);
                        listContainer.appendTo(content);
                        return content;
                    }
                }).on('shown', callbackFn).on('shown.bs.popover', callbackFn).addListener('click', function (e) { e.stopPropagation(); });
            }, this);
        }, this);
        //#endregion
        //#region Popover aprovação detalhes
        var approvalRequestsWithApproval = _.chain(this.serverData.TaskData.ExternalTaskItems).filter(function (x) { return x.ApprovalRequest != null && x.ApprovalRequest.Approval != null; }).pluck('ApprovalRequest').value();
        var approvalInfoIcons = $('.approval-request-info[data-approvalrequestid]');
        _.each(approvalInfoIcons, function (element) {
            try {
                if ($(element).attr('haspopover')) {
                    $(element)[0].approvalRequestData = null;
                    $(element).off('shown').off('shown.bs.popover');
                    $(element).popover('destroy');
                    $(element).removeAttr('haspopover');
                }
            }
            catch (e) {
            }
            var approvalRequestID = $(element).attr('data-approvalrequestid');
            var approvalRequestData = _.filter(approvalRequestsWithApproval, function (x) { return x.ApprovalRequestID == approvalRequestID; })[0];
            if (!approvalRequestData)
                return;
            var popoverID = 'popoverBody_' + element.id;
            var callbackFn = function () {
                Utils.SetupHidePopover(element, popoverID);
            };
            $(element).attr('haspopover', true);
            $(element)[0].approvalRequestData = approvalRequestData;
            $(element).popover({
                html: true,
                container: '.task-details',
                title: Utils.FormatTitlePopover(element, approvalRequestData.ApprovalRequestStatusID == EnumApprovalRequestStatus.Reproved ? 'Reprovação' : 'Aprovação', true, 'approval-request-popover'),
                placement: 'bottom',
                content: function (a) {
                    var approvalRequest = this.approvalRequestData;
                    var content = $('<div class="row-fluid info-popover approval-request-popover">').attr('id', popoverID);
                    var ul = $('<ul>');
                    //approval info
                    $('<li style="float: none;"><span><b>' + Resources.Approval.ApproverName + '</b> ' + approvalRequest.Approval.ApproverName + '</span></li>').appendTo(ul);
                    $('<li style="float: none;"><span><b>' + Resources.Approval.ApproverEmail + '</b> ' + approvalRequest.Approval.ApproverEmail + '</span></li>').appendTo(ul);
                    $('<li style="float: none;"><span><b>' + Resources.Approval.ApprovalDate + '</b> ' + $M(approvalRequest.Approval.ApprovalDate).format(environmentData.RegionalSettings.MomentDateTimeFormat) + '</span></li>').appendTo(ul);
                    //approval items
                    if (approvalRequest.ApprovalRequestStatusID == EnumApprovalRequestStatus.Approved) {
                        var attachmentApprovalItems = _.filter(approvalRequest.ApprovalRequestItem, function (x) { return x.AttachmentID > 0 && x.AttachmentName.length > 0 && x.ApprovalRequestStatusID == EnumApprovalRequestStatus.Approved; });
                        if (attachmentApprovalItems.length > 0) {
                            $('<li style="float: none;"><span><b>' + Resources.Approval.ApprovalItems + '</b></span></li>').appendTo(ul);
                            _.each(attachmentApprovalItems, function (x) {
                                var li = $('<li>');
                                $('<i class="icon icon-paper-clip">').appendTo(li);
                                var itemSpan = $('<p>').text(x.AttachmentName).appendTo(li);
                                li.appendTo(ul);
                            });
                        }
                    }
                    else {
                        var externalItemApprovalItem = _.filter(approvalRequest.ApprovalRequestItem, function (x) { return !x.AttachmentID && x.ExternalTaskItemID > 0 && x.ApprovalRequestStatusID == EnumApprovalRequestStatus.Reproved; })[0];
                        if (externalItemApprovalItem && (externalItemApprovalItem.Comment || '') != '')
                            $('<li><span><b>' + Resources.Commons.Comment + ':</b> ' + externalItemApprovalItem.Comment + '</span><li>').appendTo(ul);
                    }
                    var listContainer = $('<div class="span12 col-md-12">');
                    ul.appendTo(listContainer);
                    listContainer.appendTo(content);
                    callbackFn();
                    return content;
                }
            }).on('shown', callbackFn).on('shown.bs.popover', callbackFn).addListener('click', function (e) { e.stopPropagation(); });
        }, this);
        //#endregion
    };
    TaskDetail.prototype.SetupApprovalsTaskAttachments = function () {
        _.each(this.serverData.TaskData.TaskAttachments, function (attachment) {
            if (!attachment.ApprovalRequest || !attachment.ApprovalRequest.Approval)
                return false;
            var elements = $('.attachments-approval-request-info[data-approvalrequestitemid=' + attachment.ApprovalRequestItem.ApprovalRequestItemID + ']');
            if (!elements || elements.length == 0)
                return false;
            _.each(elements, function (element) {
                try {
                    if ($(element).attr('haspopover')) {
                        $(element)[0].attachment = null;
                        $(element).off('shown').off('shown.bs.popover');
                        $(element).popover('destroy');
                        $(element).removeAttr('haspopover');
                    }
                }
                catch (e) {
                }
                var popoverID = 'popoverBody_' + element.id;
                var callbackFn = function () {
                    Utils.SetupHidePopover(element, popoverID);
                };
                $(element).attr('haspopover', true);
                $(element)[0].attachmentData = attachment;
                $(element).popover({
                    html: true,
                    container: '.task-details',
                    title: Utils.FormatTitlePopover(element, attachment.ApprovalRequestItem.ApprovalRequestStatusID == EnumApprovalRequestStatus.Reproved ? 'Reprovação' : 'Aprovação', true, 'approval-request-popover'),
                    placement: 'bottom',
                    content: function (a) {
                        var attachment = this.attachmentData;
                        var approvalRequest = this.attachmentData.ApprovalRequest;
                        var approvalRequestItem = this.attachmentData.ApprovalRequestItem;
                        var content = $('<div class="row-fluid info-popover approval-request-popover">').attr('id', popoverID);
                        var ul = $('<ul>');
                        //approval info
                        $('<li style="float: none;"><span><b>' + Resources.TaskAttachment.Attachment + ':</b> ' + attachment.Name + '</span></li>').appendTo(ul);
                        $('<li style="float: none;"><span><b>' + Resources.Commons.Status + ':</b> ' + approvalRequestItem.ApprovalRequestStatus + '</span></li>').appendTo(ul);
                        $('<li style="float: none;"><span><b>' + Resources.Approval.ApproverName + '</b> ' + approvalRequest.Approval.ApproverName + '</span></li>').appendTo(ul);
                        $('<li style="float: none;"><span><b>' + Resources.Approval.ApproverEmail + '</b> ' + approvalRequest.Approval.ApproverEmail + '</span></li>').appendTo(ul);
                        $('<li style="float: none;"><span><b>' + Resources.Approval.ApprovalDate + '</b> ' + $M(approvalRequest.Approval.ApprovalDate).format(environmentData.RegionalSettings.MomentDateTimeFormat) + '</span></li>').appendTo(ul);
                        if (approvalRequestItem && (approvalRequestItem.Comment || '') != '')
                            $('<li style="float: none;"><span><b>' + Resources.Commons.Comment + ':</b> ' + approvalRequestItem.Comment + '</span></li>').appendTo(ul);
                        var listContainer = $('<div class="span12 col-md-12">');
                        ul.appendTo(listContainer);
                        listContainer.appendTo(content);
                        callbackFn();
                        return content;
                    }
                }).on('shown', callbackFn).on('shown.bs.popover', callbackFn).addListener('click', function (e) { e.stopPropagation(); });
            });
        }, this);
    };
    TaskDetail.prototype.AddNewExtranetAttachment = function () {
        this.extranetAttachmentControl.AddSingleFile();
    };
    TaskDetail.prototype.PostNewExtranetPost = function () {
        if (!this.viewModel.NewExternalTaskItem.ToClientContactID()) {
            $('#spnContactMembersInvalid').show();
            return false;
        }
        $('#spnContactMembersInvalid').hide();
        $('#btnSaveExternalTask').button('loading');
        taskrow.DisplayLoading();
        setTimeout(function () {
            $('#frmPostExternalItem').submit();
        }, 140);
    };
    TaskDetail.prototype.OnNewExtranetPostEnd = function (result) {
        taskrow.HideLoading();
        $('#btnSaveExternalTask').button('reset');
        this.ResetExtranetPostArea();
        this.notifyClientContactSearch.Reset();
        if (this.extranetAttachmentControl)
            this.extranetAttachmentControl.Reset();
        //this.clientContactSearch.Reset();
        this.ReloadTask(null, true);
    };
    TaskDetail.prototype.CancelApprovalRequest = function (externalTaskItemID, approvalRequestID) {
        var self = this;
        if (this.viewModel.SelectedTask.TaskData().ExtranetClosed)
            return;
        var confirmText = Resources.Approval.ConfirmCancelApprovalRequest;
        UI.ConfirmYesNo(confirmText, function () {
            $('#btnCancelApprovalRequest' + externalTaskItemID).button('loading');
            taskrow.DisplayLoading();
            $.ajax({
                url: '/Task/CancelApprovalRequest',
                type: 'POST',
                data: { taskNumber: self.selectedTaskInfo.taskNumber, approvalRequestID: approvalRequestID, currentConnectionID: $.connection.hub.id },
                success: function (data) {
                    taskrow.HideLoading();
                    $('#btnCancelApprovalRequest' + externalTaskItemID).button('reset');
                    if (data.Success == false) {
                        UI.Alert(data.Message);
                        return false;
                    }
                    var self2 = taskrow.currentModule.currentTask;
                    self2.ReloadTask(null, true);
                },
                error: function () {
                    taskrow.HideLoading();
                }
            });
        }.bind(this));
    };
    TaskDetail.prototype.RemoveNotifyContact = function (contact) {
        this.notifyClientContactSearch.DeleteContact(contact.ClientContactID);
        this.viewModel.NewExternalTaskItem.RemoveNotifyContact(contact);
    };
    TaskDetail.prototype.ChangeDueDateInterval = function (interval) {
        var self = this;
        var ownerUserID = self.viewModel.SelectedTask.TaskData().Owner.UserID;
        this.changeDueDateAllocationControl.viewModel.UserID(ownerUserID);
        if (interval != null)
            this.changeDueDateAllocationControl.viewModel.SetInterval(interval);
        else
            this.changeDueDateAllocationControl.viewModel.OpenDatePicker();
        this.changeDueDateViewModel.Interval(interval);
    };
    TaskDetail.prototype.ShowTaskHeaderDialog = function (scenario, callback, cancelCallback) {
        var dialogData = {};
        var self = this;
        var dialogOptions = new ModalWindowOptions();
        var fnAfterShow = function (modal) {
            var datepickerOptions = { format: self.GetDateFormatForDatePicker() };
            var currentTask = taskrow.currentModule.currentTask;
            var currentTaskData = currentTask.viewModel.SelectedTask.TaskData();
            $("#txtNewTitle_Dialog").val(currentTask.viewModel.SelectedTask.TaskTitle());
            if ($('#txtNewDueDate_Dialog').length > 0) {
                var owner = currentTaskData.Owner;
                var inProgressSubtasks = currentTask.viewModel.ParentTask.SubtasksInProgress();
                var hasSubtasks = inProgressSubtasks.length > 0;
                var autoApplyToSubtasks = false;
                if (hasSubtasks) {
                    //NOVA REGRA: marcar para aplicar alteração sempre que todas as subs possuirem prazos iguais ao da tarefa principal, 
                    //pois significa que correm juntas independente de estarem atrasadas ou serem replicas
                    autoApplyToSubtasks = !_.any(inProgressSubtasks, function (x) { return x.DueDate != currentTaskData.DueDate; });
                }
                self.changeDueDateViewModel = new DueDateViewModel();
                self.changeDueDateViewModel.HasSubtasks(hasSubtasks);
                self.changeDueDateViewModel.OwnerUser(owner);
                self.changeDueDateAllocationControl = new AllocationControl();
                self.changeDueDateAllocationControl.Init($('#changeDueDateSelector')[0], 3, //max task visible in day
                function (date) {
                    self.changeDueDateViewModel.NewDueDate(date);
                }, self.viewModel.SelectedTask.TaskData().TaskTitle, Resources.Task.NewDueDate);
                ko.applyBindings(self.changeDueDateViewModel, $('#taskHeaderUpdate')[0]);
                setTimeout(function () {
                    var ownerUserID = self.viewModel.SelectedTask.TaskData().Owner.UserID;
                    this.changeDueDateAllocationControl.viewModel.UserID(ownerUserID);
                    this.changeDueDateAllocationControl.viewModel.SetInterval(AllocationIntervalDays.TenDays);
                    this.changeDueDateViewModel.Interval(AllocationIntervalDays.TenDays);
                    if (autoApplyToSubtasks)
                        $('#chkDuedateToSubtasks').attr('checked', 'checked');
                    else
                        $('#chkDuedateToSubtasks').removeAttr('checked');
                }.bind(self), 100);
            }
            if ($('#dueDateOrderContainer').length > 0) {
                self.changeDueDateOrderViewModel = new DueDateOrderViewModel();
                //load tasks
                taskrow.DisplayLoading();
                $.get('/Task/ListUserTasksByDueDate', { ownerUserID: self.serverData.TaskData.Owner.UserID, dueDate: $M(self.serverData.TaskData.DueDate, true).format('YYYY-MM-DDT00:00:00') }, function (data) {
                    var tasks = _.map(data, function (t) {
                        return {
                            TaskID: t.TaskID,
                            TaskNumber: t.TaskNumber,
                            TaskTitle: "#" + t.TaskNumber + " " + t.Title,
                            DueDateOrder: t.DueDateOrder
                        };
                    });
                    self.changeDueDateOrderViewModel.Tasks(tasks);
                    ko.applyBindings(self.changeDueDateOrderViewModel, $('#taskHeaderUpdate')[0]);
                    taskrow.HideLoading();
                });
            }
            if ($("#txtTaskTags_Dialog").length > 0) {
                var existingTags = _.map(currentTask.viewModel.SelectedTask.TaskData().Tags, function (tag) {
                    var tagItem = new TagItem(tag.TagTitle, true, tag.TagKey, tag.DisplayName, tag.ColorID, tag.TagGroup);
                    tagItem['Context'] = tag.Context;
                    return tagItem;
                });
                var contextTags = _.map(currentTask.viewModel.ContextTaskTags(), function (tag) {
                    var tagItem = new TagItem(tag.TagTitle, true, tag.TagKey, tag.DisplayName, tag.ColorID, tag.TagGroup);
                    tagItem['Context'] = tag.Context;
                    return tagItem;
                });
                var allowFreeEntries = !self.serverData.JobData.TagContextID || self.serverData.JobData.TagContextID == EnumTagContext.Open;
                self.tagSelector = new TagSelector($("#txtTaskTags_Dialog")[0], {
                    placeholder: Resources.Task.AddTag,
                    contextTags: contextTags,
                    initialTags: existingTags,
                    allowFreeEntries: allowFreeEntries,
                    orderField: 'displayName',
                    groupBy: 'Context',
                    renderer: function (data) {
                        var colorCss = 'badge-color' + (data.colorID > 0 ? data.colorID : '');
                        var tagGroup = data.tagGroup && data.tagGroup.length > 0 ? '[' + data.tagGroup + ']' : '';
                        return tagGroup + ' <span class="tag ' + colorCss + '">' + data.name + '</span>';
                    },
                    selectionItemClass: function (data) {
                        return 'badge-color' + (data.colorID > 0 ? data.colorID : '');
                    }
                });
                self.tagSelector.disabledMode = false;
                self.tagSelector.Init();
            }
            if ($('#memberSearchBox_dialog').length > 0) {
                self.memberSearchUser = new SearchUser({
                    searchBox: $('#memberSearchBox_dialog')[0],
                    mode: SearchUserMode.Multiple,
                    renderUsers: true,
                    initialUsers: currentTaskData.Members,
                    placeholder: Resources.Task.Followers
                });
                self.memberSearchUser.Init();
            }
            if ($('#extranetMembersSearchBox_dialog').length > 0) {
                self.extranetMemberSearchUser = new ClientContactSearch({
                    searchBox: $('#extranetMembersSearchBox_dialog')[0],
                    mode: ClientContactSearchMode.Multiple,
                    renderContacts: true,
                    initialContacts: _.pluck(currentTaskData.ExternalMembers, 'Contact'),
                    contactsToSearch: self.extranetContactsToSearch,
                    placeholder: Resources.Task.ExternalMembers
                });
                self.extranetMemberSearchUser.selectContactCallback = function (contact) {
                    if (!_.any(self.viewModel.NewExternalTaskItem.MemberContacts(), function (x) { return x.ClientContactID == contact.ClientContactID; })) {
                        self.viewModel.NewExternalTaskItem.MemberContacts.push(contact);
                    }
                };
                self.extranetMemberSearchUser.Init();
            }
            if ($('#txtEffortEstimationTimepicker').length > 0) {
                //clear current effort estimation
                self.changeEffortestimationViewModel = null;
                self.initialEffortEstimationType = null;
                self.effortEstimationCurrentTaskData = null;
                self.effortEstimationCurrentTaskData = currentTaskData;
                self.LoadCurrentEffortEstimation(true);
                ko.applyBindings(self.changeEffortestimationViewModel, $('#taskHeaderUpdate')[0]);
                self.SetupEffortEstimation();
                if (self.initialEffortEstimationType != null)
                    self.ToggleEffortTimepicker(self.initialEffortEstimationType);
            }
            if ($('#txtRemainingEffortEstimationTimepicker').length > 0) {
                //clear current effort estimation
                self.changeRemainingEffortEstimationViewModel = new EditEffortEstimationViewModel();
                self.changeRemainingEffortEstimationViewModel.SelectedEffortEstimationType(EnumTimepickerMode.Hours);
                self.changeRemainingEffortEstimationViewModel.EffortEstimation(currentTaskData.RemainingEffortEstimation || 0);
                self.changeRemainingEffortEstimationViewModel.EffortUnitListString(null);
                ko.applyBindings(self.changeRemainingEffortEstimationViewModel, $('#taskHeaderUpdate')[0]);
                var timeList = [].concat(_.range(8).map(function (x) { return x * 15; }), _.range(8).map(function (x) { return (8 * 15) + x * 30; }), _.range(34).map(function (x) { return (12 * 30) + x * 60; }), _.range(31).map(function (x) { return (40 * 60) + x * 240; }));
                $('#taskHeaderUpdate input#txtRemainingEffortEstimationTimepicker').timesheetpicker({
                    mode: EnumTimepickerMode.Hours,
                    timeList: timeList,
                    openStart: true,
                    keepEditMode: true,
                    setTimecallback: function (minutesSpent) {
                        self.changeRemainingEffortEstimationViewModel.EffortEstimation(minutesSpent);
                    }.bind(this)
                });
            }
            if ($('#dropDownRequestContact').length > 0) {
                var select = document.getElementById('dropDownRequestContact');
                select.innerHTML = '';
                var optSelect = document.createElement('option');
                optSelect.innerHTML = Resources.Task.NoneRequester;
                optSelect.value = '-1';
                select.appendChild(optSelect);
                taskrow.DisplayLoading();
                $.get('/Client/ListClientContacts', { clientID: self.serverData.JobData.Client.ClientID }, function (contactList) {
                    taskrow.HideLoading();
                    _.each(contactList, function (contact) {
                        var opt = document.createElement('option');
                        opt.value = contact.ClientContactID;
                        opt.innerHTML = contact.ContactName;
                        select.appendChild(opt);
                    });
                    if (self.serverData.TaskData.RequestContact && self.serverData.TaskData.RequestContact.ClientContactID > 0)
                        $('#dropDownRequestContact').val(self.serverData.TaskData.RequestContact.ClientContactID);
                });
            }
            if ($('#searchDeliverableContextBox').length > 0) {
                var context = Utils.GetJobContext(self.serverData.JobData);
                context = context.map(function (x) { return (__assign({}, x, { Hide: true })); });
                if (self.serverData.TaskData.Deliverable) {
                    context.push(new BreadcrumbItem(self.serverData.TaskData.Deliverable.Name, URLs.BuildUrl({
                        ClientNickName: self.serverData.JobData.Client.ClientNickName,
                        JobNumber: self.serverData.JobData.JobNumber,
                        DeliverableID: self.serverData.TaskData.Deliverable.DeliverableID
                    }, 'deliverable'), 'deliverableID', self.serverData.TaskData.Deliverable.DeliverableID));
                }
                var $deliverableHidden = $('#ChangeDeliverableID');
                var searchDeliverableContextBox = $('#searchDeliverableContextBox')[0];
                self.changeDeliverableContext = new ContextSearch(searchDeliverableContextBox, context, ContextSearchMode.Selection, Resources.Task.SearchDeliverable);
                self.changeDeliverableContext.searchTasks = false;
                self.changeDeliverableContext.searchJobs = false;
                self.changeDeliverableContext.searchClients = false;
                self.changeDeliverableContext.searchProducts = false;
                self.changeDeliverableContext.showInactives = false;
                self.changeDeliverableContext.searchDeliverables = true;
                self.changeDeliverableContext.lockDelete = !self.serverData.TaskData.Deliverable;
                self.changeDeliverableContext.selectItemCallback = function (item) {
                    if (item.DeliverableID && item.DeliverableID > 0) {
                        $deliverableHidden.val(item.DeliverableID);
                        self.changeDeliverableContext.lockDelete = false;
                    }
                    else {
                        self.changeDeliverableContext.lockDelete = true;
                    }
                };
                self.changeDeliverableContext.deleteItemCallback = function (context) {
                    $deliverableHidden.val('-1');
                    self.changeDeliverableContext.lockDelete = false;
                };
                self.changeDeliverableContext.resetContextCallback = function (context) {
                    $deliverableHidden.val('-1');
                };
                self.changeDeliverableContext.Init();
                if (self.serverData.TaskData.Deliverable && self.serverData.TaskData.Deliverable.DeliverableID > 0)
                    $deliverableHidden.val(self.serverData.TaskData.Deliverable.DeliverableID);
                else
                    $deliverableHidden.val('-1');
            }
        };
        var selectedTaskData = taskrow.currentModule.currentTask.viewModel.SelectedTask.TaskData();
        switch (scenario) {
            case this.TASK_HEADER_SCENARIO.ReopenTask:
                dialogData.changeDueDate = selectedTaskData.ActualPermissions.ReopenTask;
                dialogOptions.title = Resources.Task.ReopenTask;
                break;
            case this.TASK_HEADER_SCENARIO.ChangeDueDate:
                dialogData.changeDueDate = selectedTaskData.ActualPermissions.ChangeDueDate;
                dialogData.showDueDateApplyToSubtasks = true;
                dialogOptions.title = Resources.Task.ChangeDueDate;
                break;
            case this.TASK_HEADER_SCENARIO.ChangeDueDateOrder:
                dialogData.changeDueDateOrder = selectedTaskData.ActualPermissions.ChangeDueDate;
                dialogOptions.title = Resources.Task.AdjustPriority;
                break;
            case this.TASK_HEADER_SCENARIO.ChangeTitle:
                var canChangeTitle = selectedTaskData.ActualPermissions.ChangeTitle;
                //var canChangeTags: boolean = canChangeTitle && !selectedTaskData.ParentTaskID;
                var canChangeTags = canChangeTitle;
                dialogData.changeTitle = canChangeTitle;
                dialogData.changeTags = canChangeTags;
                dialogOptions.title = canChangeTags ? Resources.Task.ChangeTitleAndTags : Resources.Task.ChangeTitle;
                break;
            case this.TASK_HEADER_SCENARIO.ChangeMembers:
                dialogData.changeMembers = selectedTaskData.ActualPermissions.CreateTask;
                dialogOptions.title = Resources.Task.ChangeMembers;
                break;
            case this.TASK_HEADER_SCENARIO.ChangeEffortEstimation:
                dialogData.changeEffortEstimation = selectedTaskData.ActualPermissions.ChangeEffortEstimation;
                dialogOptions.title = Resources.Task.ChangeEffortEstimation;
                dialogOptions.style = 'width: 680px';
                break;
            case this.TASK_HEADER_SCENARIO.ChangeRemainingEffortEstimation:
                dialogData.changeRemainingEffortEstimation = selectedTaskData.ActualPermissions.ChangeEffortEstimation || selectedTaskData.OwnerUserID == environmentData.currentUserID;
                dialogOptions.title = Resources.Task.ChangeRemainingEffortEstimation;
                dialogOptions.style = 'width: 680px';
                break;
            case this.TASK_HEADER_SCENARIO.ChangeRequestContact:
                dialogData.changeRequestContact = selectedTaskData.ActualPermissions.ChangeRequestContact;
                dialogOptions.title = Resources.Task.ChangeRequestContact;
                break;
            case this.TASK_HEADER_SCENARIO.ChangeDeliverable:
                dialogData.changeDeliverable = selectedTaskData.ActualPermissions.CreateTask;
                dialogOptions.title = Resources.Task.ChangeDeliverable;
                break;
            case this.TASK_HEADER_SCENARIO.ChangeExtranetMembers:
                dialogData.changeExtranetMembers = selectedTaskData.ActualPermissions.CreateTask;
                dialogOptions.title = Resources.Task.ExternalMembers;
                break;
        }
        var btnSave = new ModalButton();
        btnSave.isPrimary = true;
        btnSave.id = "btnSaveTaskHeader";
        btnSave.label = Resources.Commons.Save;
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.action = function (e, modal) {
            var $MnewDueDate = null;
            var duedateToSubtasks = null;
            var selectedTags = null;
            var title = null;
            var selectedUsers = null;
            var effortEstimation = null;
            var effortUnitListString = null;
            var requestContactID = null;
            var deliverableID = null;
            var selectedExternalMembers = null;
            var orderTaskNumbers = null;
            if (dialogData.changeDueDate) {
                var selectedValue = $('#txtNewDueDate_Dialog').val().toString();
                $MnewDueDate = moment(selectedValue, self.GetDateFormatForMoment());
                if (!$MnewDueDate || (!$MnewDueDate.isValid()) || ($MnewDueDate.diff($M(null, true)) < 0)) {
                    $('#txtMessage').html(Resources.Task.SelectAValidDueDate);
                    $('#btnSaveTaskHeader').removeAttr('disabled');
                    return;
                }
                duedateToSubtasks = $('#chkDuedateToSubtasks').length > 0 && $('#chkDuedateToSubtasks')[0]['checked'];
            }
            if (dialogData.changeDueDateOrder) {
                orderTaskNumbers = _.pluck(self.changeDueDateOrderViewModel.Tasks(), 'TaskNumber');
            }
            if (dialogData.changeTitle) {
                title = $("#txtNewTitle_Dialog").val();
                if (!title || title.length == 0) {
                    $('#txtMessage').html(Resources.Task.TaskTitle_Required);
                    $('#btnSaveTaskHeader').removeAttr('disabled');
                    return;
                }
            }
            if (dialogData.changeTags) {
                selectedTags = self.tagSelector.GetSelectedValues();
            }
            if (dialogData.changeMembers) {
                selectedUsers = self.memberSearchUser.GetSelectedUsers();
            }
            if (dialogData.changeEffortEstimation) {
                effortEstimation = +$('#taskHeaderUpdate #EffortEstimation').val();
                effortUnitListString = $('#taskHeaderUpdate #EffortUnitListString').val();
            }
            if (dialogData.changeRemainingEffortEstimation) {
                effortEstimation = +$('#taskHeaderUpdate #RemainingEffortEstimation').val();
            }
            if (dialogData.changeRequestContact) {
                requestContactID = +$("#taskHeaderUpdate #dropDownRequestContact").val();
                if (!requestContactID || requestContactID == 0) {
                    $('#txtMessage').html(Resources.Task.RequestContact_Required);
                    $('#btnSaveTaskHeader').removeAttr('disabled');
                    return;
                }
            }
            if (dialogData.changeDeliverable) {
                deliverableID = +$('#ChangeDeliverableID').val();
                if (deliverableID == 0)
                    deliverableID = -1;
            }
            if (dialogData.changeExtranetMembers) {
                selectedExternalMembers = self.extranetMemberSearchUser.GetSelectedContacts();
            }
            $('#txtMessage').html('');
            if (callback) {
                if (dialogData.changeDueDate)
                    callback(modal, $MnewDueDate, duedateToSubtasks);
                else if (dialogData.changeDueDateOrder)
                    callback(modal, orderTaskNumbers);
                else if (dialogData.changeExtranetMembers)
                    callback(modal, selectedExternalMembers);
                else
                    callback(modal, $MnewDueDate, title, selectedTags, selectedUsers, effortEstimation, effortUnitListString, requestContactID, deliverableID, duedateToSubtasks);
            }
        };
        var btnCancel = new ModalButton();
        btnCancel.label = Resources.Commons.Cancel;
        btnCancel.action = function (e, modal) {
            modal.close();
        };
        dialogOptions.closeButton = false;
        dialogOptions.buttons.push(btnSave);
        dialogOptions.buttons.push(btnCancel);
        dialogOptions.onClose = function (e, modal) {
            Utils.CleanNode($('#taskHeaderUpdate')[0]);
            if (self.changeDueDateAllocationControl) {
                self.changeDueDateAllocationControl.Destroy();
                self.changeDueDateAllocationControl = null;
            }
            if (self.changeDeliverableContext) {
                self.changeDeliverableContext.Unload();
                self.changeDeliverableContext = null;
            }
            if (cancelCallback)
                cancelCallback();
        };
        UI.ShowModal(taskrow.templatePath + 'Task/TaskHeader', dialogData, dialogOptions, fnAfterShow);
    };
    TaskDetail.prototype.LoadCurrentEffortEstimation = function (loadInitialMode) {
        var self = this;
        if (!this.effortEstimationCurrentTaskData)
            return;
        if (this.changeEffortestimationViewModel == null)
            this.changeEffortestimationViewModel = new EditEffortEstimationViewModel();
        var timepickerMode = EnumTimepickerMode.Hours;
        var estimation = this.effortEstimationCurrentTaskData.EffortEstimation;
        var effortUnitListString = this.effortEstimationCurrentTaskData.EffortUnitListString;
        var effortUnitTask = this.effortEstimationCurrentTaskData.EffortUnitTask;
        if (effortUnitListString && effortUnitListString.length > 0) {
            _.each(effortUnitTask, function (x) {
                var m = new EffortUnitViewModel(x);
                m.Amount(x.Amount);
                self.changeEffortestimationViewModel.EffortUnit.push(m);
            });
            timepickerMode = null;
        }
        else if (estimation >= 480 && estimation % 480 == 0) {
            timepickerMode = EnumTimepickerMode.Days;
        }
        this.changeEffortestimationViewModel.SelectedEffortEstimationType(timepickerMode);
        this.changeEffortestimationViewModel.EffortEstimation(estimation);
        this.changeEffortestimationViewModel.EffortUnitListString(effortUnitListString);
        if (loadInitialMode === true)
            this.initialEffortEstimationType = timepickerMode;
    };
    TaskDetail.prototype.SetupEffortEstimation = function () {
        var self = this;
        this.effortTimepicker = $('#taskHeaderUpdate input#txtEffortEstimationTimepicker').timesheetpicker({
            openStart: true,
            keepEditMode: true,
            setTimecallback: function (time) {
                self.changeEffortestimationViewModel.EffortUnitListString('');
                self.changeEffortestimationViewModel.EffortEstimation(time);
            }
        });
        this.SetupEffortUnitTemplate();
        this.SetupEffortUnitPopover();
        var effortUnitList = self.GetAvailableEffortUnitList();
        this.effortUnitSelector = new TagSelector($("#txtTaskHeaderSearchEffortUnit")[0], { placeholder: Resources.Task.AddEffortUnit, contextTags: effortUnitList, useTabKey: false });
        this.effortUnitSelector.selectionchangeCallback = function (selection) {
            if (selection && selection.length > 0) {
                var effortUnitID = selection[0].id;
                var effortUnit = _.findWhere(environmentData.EffortUnitList, { 'EffortUnitID': effortUnitID });
                if (effortUnit) {
                    var model = new EffortUnitViewModel(effortUnit);
                    self.changeEffortestimationViewModel.EffortUnit.push(model);
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
    };
    TaskDetail.prototype.ToggleEffortTimepicker = function (mode) {
        var beforeMode = this.changeEffortestimationViewModel.SelectedEffortEstimationType();
        this.changeEffortestimationViewModel.SelectedEffortEstimationType(mode);
        if (this.newEffortPopover)
            this.newEffortPopover.popover('hide');
        if (this.effortTimepicker != null && this.effortTimepicker[0].attr.mode != mode) {
            this.effortTimepicker.timesheetpicker('changeMode', mode);
        }
        if (beforeMode != mode) {
            this.changeEffortestimationViewModel.EffortEstimation(0);
            //se antes era por unidade, remove todos e reseta
            if (!beforeMode) {
                this.changeEffortestimationViewModel.EffortUnit.removeAll();
                this.ResetSearchEffortUnit();
            }
            if (this.initialEffortEstimationType == mode)
                this.LoadCurrentEffortEstimation();
        }
    };
    TaskDetail.prototype.ShowEffortUnit = function () {
        this.changeEffortestimationViewModel.EffortEstimation(0);
        this.changeEffortestimationViewModel.SelectedEffortEstimationType(null);
        if (this.effortTimepicker != null)
            this.effortTimepicker.timesheetpicker('reset');
        if (environmentData.EffortUnitList.length == 0 && this.newEffortPopover)
            this.newEffortPopover.popover('show');
        if (this.initialEffortEstimationType === null)
            this.LoadCurrentEffortEstimation();
    };
    TaskDetail.prototype.ValidateEffortUnit = function () {
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
    TaskDetail.prototype.SaveEffortUnit = function () {
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
        $.ajax({
            url: 'Task/SaveEffortUnit',
            data: { unitName: unitName, effort: effort },
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
                taskrow.currentModule.currentTask.changeEffortestimationViewModel.EffortUnit.push(model);
                if (taskrow.currentModule.currentTask.newEffortPopover)
                    taskrow.currentModule.currentTask.newEffortPopover.popover('hide');
            }
        });
    };
    TaskDetail.prototype.ResetSearchEffortUnit = function () {
        if (this.effortUnitSelector) {
            this.effortUnitSelector.SetData(this.GetAvailableEffortUnitList());
            this.effortUnitSelector.Clear();
        }
    };
    TaskDetail.prototype.SetupEffortUnitTemplate = function () {
        var self = this;
        taskrow.LoadTemplate(taskrow.templatePath + 'Task/EffortUnit', function (getHTML) {
            self.EffortUnitContent = getHTML({});
        });
    };
    TaskDetail.prototype.SetupEffortUnitPopover = function () {
        var self = this;
        this.newEffortPopover = $('#taskHeaderEffortUnitPopover').popover({
            html: true,
            placement: 'right',
            title: Utils.FormatTitlePopover($('#taskHeaderEffortUnitPopover')[0], Resources.Task.AddNewEffortUnit, true),
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
    TaskDetail.prototype.GetAvailableEffortUnitList = function () {
        var selectedEffortUnits = _.map(this.changeEffortestimationViewModel.EffortUnit(), function (x) { return x.EffortUnitID(); });
        var available = _.difference(_.pluck(environmentData.EffortUnitList, 'EffortUnitID'), selectedEffortUnits);
        return _.chain(environmentData.EffortUnitList)
            .filter(function (x) { return _.some(available, function (a) { return a == x.EffortUnitID; }); })
            .sortBy(function (x) { return x.UnitName; })
            .map(function (x) { return new TagItem(x.UnitName, null, x.EffortUnitID); }).value();
    };
    TaskDetail.prototype.RemoveEffortUnit = function (unit) {
        this.changeEffortestimationViewModel.EffortUnit.remove(unit);
        this.ResetSearchEffortUnit();
        this.CalcEffortUnitTotal();
    };
    TaskDetail.prototype.RemoveAllEffortUnit = function () {
        this.changeEffortestimationViewModel.EffortUnit.removeAll();
        this.ResetSearchEffortUnit();
        this.CalcEffortUnitTotal();
    };
    TaskDetail.prototype.CalcEffortUnitTotal = function () {
        var list = ko.toJS(this.changeEffortestimationViewModel.EffortUnit());
        var effortUnitListString = _.map(list, function (x) { return x.EffortUnitID + '|' + x.Amount; }).join(',');
        this.changeEffortestimationViewModel.EffortUnitListString(effortUnitListString);
        var total = _.sum(list, 'EffortTotalMinutes');
        this.changeEffortestimationViewModel.EffortEstimation(isNaN(total) ? 0 : total);
    };
    //#endregion
    TaskDetail.prototype.OptInNotifyOnEveryChange = function () {
        var self = this;
        taskrow.DisplayLoading();
        $.ajax({
            url: '/Task/OptInNotifyOnEveryChange',
            type: 'GET',
            data: { taskNumber: this.selectedTaskInfo.taskNumber },
            success: function () {
                taskrow.HideLoading();
                self.serverData.TaskData.NotifyMe = true;
                self.viewModel.SelectedTask.NotifyMe(true);
                self.UpdateSiblingTask(self.serverData.TaskData);
                self.RefreshLoadedTask(self.serverData.TaskData);
            },
            error: function () { taskrow.HideLoading(); }
        });
    };
    TaskDetail.prototype.OptOutNotifyOnEveryChange = function () {
        var self = this;
        taskrow.DisplayLoading();
        $.ajax({
            url: '/Task/OptOutNotifyOnEveryChange',
            type: 'GET',
            data: { taskNumber: this.selectedTaskInfo.taskNumber },
            success: function () {
                taskrow.HideLoading();
                self.serverData.TaskData.NotifyMe = false;
                self.viewModel.SelectedTask.NotifyMe(false);
                self.UpdateSiblingTask(self.serverData.TaskData);
                self.RefreshLoadedTask(self.serverData.TaskData);
            },
            error: function () { taskrow.HideLoading(); }
        });
    };
    TaskDetail.prototype.FollowTask = function (follow) {
        var self = this;
        taskrow.DisplayLoading();
        $.ajax({
            url: follow ? '/Task/FollowTask' : '/Task/UnfollowTask',
            type: 'GET',
            data: { taskNumber: this.selectedTaskInfo.taskNumber, connectionID: SignalrHub.MainHub.connection.id },
            success: function (data) {
                taskrow.HideLoading();
                if (data.Success == false) {
                    UI.Alert(data.Message);
                    return false;
                }
                var taskID = data.Entity.TaskID;
                var rowVersion = data.Entity.RowVersion;
                var members = data.Entity.Members;
                var memberListString = _.pluck(members, 'UserID').join(',');
                if (self.serverData.TaskData.TaskID == taskID) {
                    self.serverData.TaskData.Members = members;
                    self.serverData.TaskData.MemberListString = memberListString;
                    self.serverData.TaskData.RowVersion = rowVersion;
                    self.serverData.TaskData.Follow = follow;
                    self.viewModel.SelectedTask.refreshData(self.serverData.TaskData);
                    self.UpdateSiblingTask(self.serverData.TaskData);
                    self.RefreshLoadedTask(self.serverData.TaskData);
                }
                self.SetupSelectedTaskMembersPopover();
            },
            error: function () {
                taskrow.HideLoading();
            }
        });
    };
    TaskDetail.prototype.DeleteTaskAttachment = function (attachment) {
        var self = this;
        var _deleteAttachment = function () {
            var _successCallback = function (data) {
                taskrow.HideLoading();
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    return false;
                }
                var taskAttachments = data.Entity;
                self.serverData.TaskData.TaskAttachments = taskAttachments;
                //refresh taskitem
                var index = _.indexOf(_.pluck(self.serverData.TaskData.NewTaskItems, 'TaskItemID'), attachment.TaskItemID);
                if (index > -1)
                    self.serverData.TaskData.NewTaskItems[index].Attachments = _.filter(self.serverData.TaskData.NewTaskItems[index].Attachments, function (x) { return x.TaskAttachmentID != attachment.TaskAttachmentID; });
                self.viewModel.SelectedTask.refreshData(self.serverData.TaskData);
            };
            var _errorCallback = function (XMLHttpRequest, textStatus, errorThrown) {
                taskrow.HideLoading();
                if (console)
                    console.error(textStatus);
            };
            taskrow.DisplayLoading();
            $.ajax({
                url: "/File/DeleteTaskAttachment/",
                data: { taskAttachmentID: attachment.TaskAttachmentID, tasknumber: self.selectedTaskInfo.taskNumber },
                success: _successCallback,
                error: _errorCallback
            });
        };
        UI.ConfirmYesNo(Resources.TaskAttachment.ConfirmDeleteAttachment, _deleteAttachment);
    };
    TaskDetail.prototype.DeleteExternalImage = function (attachment) {
        var self = this;
        this.DeleteAttachment(attachment, function () {
            self.viewModel.SelectedTask.ExternalImages.remove(attachment);
        });
    };
    TaskDetail.prototype.DeleteExternalAttachment = function (attachment) {
        var self = this;
        var callbackDelete = attachment.AttachmentTypeID == EnumTaskAttachmentType.LocalImageTypeID ?
            function () { self.viewModel.SelectedTask.ExternalImages.remove(attachment); } :
            function () { self.viewModel.SelectedTask.ExternalAttachments.remove(attachment); };
        this.DeleteAttachment(attachment, callbackDelete);
    };
    TaskDetail.prototype.DeleteAttachment = function (attachment, successCallback) {
        var self = this;
        var _deleteAttachment = function () {
            var _successCallback = function (data) {
                taskrow.HideLoading();
                if (data.Success) {
                    successCallback();
                    $('div.externalAttachmentList li[attachmentid=' + attachment.AttachmentID + ']').remove();
                    //refresh taskitem
                    var index = _.indexOf(_.pluck(self.serverData.TaskData.ExternalTaskItems, 'ExternalTaskItemID'), attachment.ExternalTaskItemID);
                    if (index > -1) {
                        self.serverData.TaskData.ExternalTaskItems[index].Attachments = _.filter(self.serverData.TaskData.ExternalTaskItems[index].Attachments, function (x) { return x.AttachmentID != attachment.AttachmentID; });
                        self.viewModel.SelectedTask.refreshData(self.serverData.TaskData);
                    }
                }
                else {
                    UI.Alert(data.Message);
                }
            };
            var _errorCallback = function (XMLHttpRequest, textStatus, errorThrown) {
                taskrow.HideLoading();
                if (console)
                    console.error(textStatus);
            };
            taskrow.DisplayLoading();
            $.ajax({
                url: "/File/DeleteAttachment/",
                data: { attachmentID: attachment.AttachmentID },
                success: _successCallback,
                error: _errorCallback
            });
        };
        UI.ConfirmYesNo(Resources.TaskAttachment.ConfirmDeleteAttachment, _deleteAttachment);
    };
    TaskDetail.prototype.ShowTaskMinutesSpent = function (taskNumber) {
        var self = this;
        //incluir solicitante
        var requestContact = this.serverData.TaskData.RequestContact;
        var templates = _(this.serverData.TaskData.NewTaskItems)
            .chain()
            .filter(function (x) { return x.RequestTypeID > 0; })
            .pluck('RequestType')
            .groupBy(function (x) { return x.RequestTypeID; })
            .pairs()
            .map(function (x) { return x[1]; })
            .value();
        taskrow.DisplayLoading();
        $.ajax({
            url: 'Task/GetTaskMinutesSpent',
            //data: { taskNumber: taskNumber },
            data: { taskNumber: taskNumber, taskID: this.selectedTaskInfo.task },
            success: function (data) {
                taskrow.HideLoading();
                if (data.Success == false) {
                    UI.Alert(data.Message);
                    return;
                }
                if (data.Entity.MainTask && data.Entity.MainTask.length > 0) {
                    var total = {
                        CurrentMonthMinutesSpent: _.sum(data.Entity.MainTask, 'CurrentMonthMinutesSpent'),
                        TotalMinutesSpent: _.sum(data.Entity.MainTask, 'TotalMinutesSpent')
                    };
                    data.Entity.MainTask_Total = total;
                }
                if (data.Entity.Subtasks && data.Entity.Subtasks.length > 0) {
                    var total = {
                        CurrentMonthMinutesSpent: _.sum(data.Entity.Subtasks, 'CurrentMonthMinutesSpent'),
                        TotalMinutesSpent: _.sum(data.Entity.Subtasks, 'TotalMinutesSpent')
                    };
                    data.Entity.Subtasks_Total = total;
                }
                if (data.Entity.TotalTask && data.Entity.TotalTask.length > 0) {
                    var total = {
                        CurrentMonthMinutesSpent: _.sum(data.Entity.TotalTask, 'CurrentMonthMinutesSpent'),
                        TotalMinutesSpent: _.sum(data.Entity.TotalTask, 'TotalMinutesSpent')
                    };
                    data.Entity.TotalTask_Total = total;
                }
                self.taskMinutesViewModel = new ViewModel({
                    MainTask: data.Entity.MainTask,
                    MainTask_Total: data.Entity.MainTask_Total,
                    Subtasks: data.Entity.Subtasks,
                    Subtasks_Total: data.Entity.Subtasks_Total,
                    TotalTask: data.Entity.TotalTask,
                    TotalTask_Total: data.Entity.TotalTask_Total,
                    RequestContact: requestContact,
                    UsageTemplates: templates
                });
                var dialogOptions = new ModalWindowOptions();
                var btnOK = new ModalButton();
                btnOK.label = 'OK';
                btnOK.action = function (e, modal) {
                    modal.close();
                };
                dialogOptions.title = Resources.Task.TaskMinutesSpent;
                dialogOptions.closeButton = false;
                dialogOptions.buttons.push(btnOK);
                dialogOptions.style = 'width: 960px;';
                dialogOptions.onClose = function (e, modal) {
                    Utils.CleanNode($('#taskMinutesSpentContainer')[0]);
                    self.taskMinutesViewModel = null;
                };
                UI.ShowModalFromTemplateID('tmplTaskMinutesSpent', {}, dialogOptions, function (modal) {
                    ko.applyBindings(self.taskMinutesViewModel, $('#taskMinutesSpentContainer')[0]);
                    $('#taskMinutesSpentContainer').jsScroll();
                    $(window).trigger('taskrow:modalbodyresized');
                });
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                taskrow.HideLoading();
                if (console)
                    console.error(textStatus);
            }
        });
    };
    TaskDetail.prototype.OpenGallery = function (attachment) {
        if (attachment.AttachmentTypeID == EnumTaskAttachmentType.LocalImageTypeID)
            $(".taskAttachmentList .images").imageGallery('open', '/File/TaskImage/?taskNumber=' + this.serverData.TaskData.TaskNumber + '&taskAttachmentID=' + attachment.TaskAttachmentID, '/File/GetTaskAttachment?taskNumber=' + this.serverData.TaskData.TaskNumber + '&taskAttachmentID=' + attachment.TaskAttachmentID);
    };
    TaskDetail.prototype.OpenExternalGallery = function (attachment) {
        if (attachment.AttachmentTypeID == EnumTaskAttachmentType.LocalImageTypeID)
            $(".externalAttachmentList .images").imageGallery('open', '/File/AttachmentImage/?attachmentID=' + attachment.AttachmentID, '/File/GetAttachment?attachmentID=' + attachment.AttachmentID);
    };
    //#region Subtask
    TaskDetail.prototype.SetupSubtaskKeypress = function () {
        $('#subtaskContainer input[type=text]').off('keypress').on('keypress', function (e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (e.keyCode == 13 || e.keyCode == 9) {
                //salvar subtask ao teclar enter/tab
                $(this).blur();
            }
        });
    };
    TaskDetail.prototype.AddNewSubtask = function () {
        var self = this;
        if (this.viewModel.SelectedTask.TaskData().Closed)
            return;
        var newsubtask = new SubtaskViewModel(self.viewModel.SelectedTask.TaskData().TaskID);
        self.viewModel.SelectedTask.Subtasks.push(newsubtask);
        //evitar excluir anexo ou submit
        this.SetupSubtaskKeypress();
    };
    TaskDetail.prototype.DeleteSubtask = function (subtask) {
        var self = this;
        var currentSubTask = this.viewModel.SelectedTask.NewPost.CurrentSubtask();
        if (currentSubTask && currentSubTask.SubtaskID == subtask.SubtaskID()) {
            UI.Alert(Resources.Subtask.DeleteSubtaskWhileAddOwner);
            return false;
        }
        if (subtask.SubtaskID() == 0)
            this.viewModel.SelectedTask.Subtasks.remove(subtask);
        else
            UI.ConfirmYesNo(Resources.Subtask.ConfirmDeleteSubtask, function () {
                var deleteSubtaskID = subtask.SubtaskID();
                subtask.UpdateStatus(Resources.Subtask.ExcludingSubtask);
                $.ajax({
                    url: 'Task/DeleteSubtask',
                    data: { subtaskID: deleteSubtaskID, currentConnectionID: $.connection.hub.id },
                    success: function (data) {
                        if (data.Success === false) {
                            UI.Alert(data.Message);
                            subtask.UpdateStatus(Resources.Subtask.ErrorOnDelete);
                            setTimeout(function () {
                                subtask.UpdateStatus(null);
                            }, 1200);
                            return false;
                        }
                        self.viewModel.SelectedTask.Subtasks.remove(subtask);
                        var index = _.indexOf(_.pluck(self.serverData.TaskData.Subtasks, 'SubtaskID'), deleteSubtaskID);
                        if (index > -1)
                            self.serverData.TaskData.Subtasks.splice(index, 1);
                    }
                });
            });
        return false;
    };
    TaskDetail.prototype.SubtaskDone = function (subtask) {
        var self = this;
        var subtaskID = subtask.SubtaskID();
        var hasChildTask = subtask.ChildTaskID() > 0;
        var isOwnerUser = this.viewModel.SelectedTask.TaskData().Owner.UserID == environmentData.currentUserID;
        var createTasksPermission = this.viewModel.SelectedTask.TaskData().ActualPermissions.CreateTask;
        var denyAccess = !isOwnerUser && !createTasksPermission;
        if (subtaskID == 0 || hasChildTask || denyAccess)
            return false;
        var done = !subtask.Done();
        subtask.UpdateStatus(Resources.Subtask.SavingChanges);
        $.ajax({
            url: 'Task/SubtaskDone',
            data: { subtaskID: subtaskID, done: done },
            success: function (data) {
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    subtask.UpdateStatus(Resources.Subtask.ErrorOnSave);
                    setTimeout(function () {
                        subtask.UpdateStatus(null);
                    }, 1200);
                    return false;
                }
                subtask.Done(done);
                var index = _.indexOf(_.pluck(self.serverData.TaskData.Subtasks, 'SubtaskID'), subtaskID);
                if (index > -1)
                    self.serverData.TaskData.Subtasks[index].Done = done;
                subtask.UpdateStatus(Resources.Subtask.SuccessfullySaved);
                setTimeout(function () {
                    subtask.UpdateStatus(null);
                }, 1200);
            }
        });
    };
    TaskDetail.prototype.SaveSubtask = function (subtask) {
        var self = this;
        if (subtask.Title().length == 0 || _.trim(subtask.Title()) == _.trim(subtask.RealTitle())) {
            subtask.RealTitle('');
            subtask.Title(_.trim(subtask.Title()));
            return false;
        }
        var subtaskData = ko.toJS(subtask);
        subtaskData.ChildTask = null;
        subtask.UpdateStatus(Resources.Subtask.SavingChanges);
        this.refreshLastReadDate = true;
        $.ajax({
            url: 'Task/SaveSubtask',
            data: Utils.ToParams({ subtask: subtaskData, currentConnectionID: $.connection.hub.id }),
            success: function (data) {
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    subtask.UpdateStatus(Resources.Subtask.ErrorOnSave);
                    setTimeout(function () {
                        subtask.UpdateStatus(null);
                    }, 1200);
                    return false;
                }
                var newSubtaskData = data.Entity;
                subtask.UpdateStatus(Resources.Subtask.SuccessfullySaved);
                if (newSubtaskData.ChildTaskID > 0) {
                    self.ReloadTask(function () {
                        setTimeout(function () {
                            if (!_.some(self.viewModel.SelectedTask.Subtasks(), function (x) { return x.SubtaskID() == 0; }))
                                self.AddNewSubtask();
                            $('div.subtask[data-subtaskid=0] input:first').focus();
                        }, 10);
                    });
                }
                else {
                    var taskID = data.Entity.Task1.TaskID;
                    var rowVersion = data.Entity.Task1.RowVersion;
                    if (self.serverData.TaskData.TaskID == taskID) {
                        self.serverData.TaskData.RowVersion = rowVersion;
                        self.viewModel.SelectedTask.TaskData(self.serverData.TaskData);
                        self.UpdateSiblingTask(self.serverData.TaskData);
                        self.RefreshLoadedTask(self.serverData.TaskData);
                    }
                    setTimeout(function () {
                        subtask.UpdateStatus(null);
                        subtask.refreshData(newSubtaskData);
                        if (!_.some(self.viewModel.SelectedTask.Subtasks(), function (x) { return x.SubtaskID() == 0; }))
                            self.AddNewSubtask();
                        $('div.subtask[data-subtaskid=0] input:first').focus();
                    }, 1200);
                }
            }
        });
    };
    TaskDetail.prototype.CreateChildTask = function (subtask) {
        if (this.viewModel.SelectedTask.TaskData().ActualPermissions.CreateSubtasks != true)
            return false;
        if (this.viewModel.SelectedTask.TaskData().ParentTaskID > 0) {
            UI.Alert(Resources.Subtask.TaskAlreadyChildTask);
            return false;
        }
        this.ResetPostArea(true);
        var subtaskData = ko.toJS(subtask);
        this.viewModel.SelectedTask.NewPost.CreateChildTask(subtaskData, false);
        if (this.allocationControl)
            this.allocationControl.viewModel.NewTaskTitle = subtaskData.Title;
        $('.new-task-item .new-owner, .new-task-item .same-owner, .new-task-item .last-owner').hide();
        $('.new-task-item').show(0, function () {
            this.ScrollToPostArea();
        }.bind(this));
        $('.btgPost').hide();
        $('.subtaskBtn').hide();
        this.SetupAttachment();
        this.SetupAttachmentFromExtranet();
        this.SetupRequestType();
        this.viewModel.SelectedTask.NewPost.setDueDate(this.viewModel.SelectedTask.TaskData().DueDate);
        this.viewModel.SelectedTask.NewPost.NewOwner({});
        var defaultRequestType = _.filter(this.viewModel.RequestTypeList(), function (x) { return !x.Extranet && x.IsDefault == true; })[0];
        if (defaultRequestType)
            this.viewModel.SelectedTask.NewPost.RequestTypeID(defaultRequestType.RequestTypeID);
        setTimeout(function (self) {
            $("#newTaskItemComment").focus();
            if (self.viewModel.SelectedTask.TaskData()['ActualPermissions'].ChangeDueDate) {
                Tutorial.ShowNewPostOnce(function () {
                    $("#newTaskItemComment").focus();
                });
            }
        }, 100, this);
        $('.new-task-item .new-owner').show();
        this.viewModel.SelectedTask.NewPost.ForceLoadAllocation(true);
        //para nova tarefa, estado inicial do esforço
        this.ResetEffortEstimationControl();
    };
    TaskDetail.prototype.ResetEffortEstimationControl = function () {
        $('#EffortEstimation').val(0);
        $('#EffortUnitListString').val('');
        this.viewModel.SelectedTask.EffortEstimation(0);
        this.viewModel.SelectedTask.EffortUnitListString('');
        this.viewModel.SelectedTask.TaskData().EffortEstimation = 0;
        this.viewModel.SelectedTask.TaskData().EffortUnitListString = '';
    };
    TaskDetail.prototype.ScrollToPostArea = function () {
        var top = $('.new-task-item').offset().top - 120;
        window.scrollTo(0, Math.max(0, top));
    };
    TaskDetail.prototype.CreateChildTaskByPost = function (taskItemID) {
        var multipleUsers = true;
        var sourcePost = this.viewModel.SelectedTask.TaskData().NewTaskItems.filter(function (x) { return x.TaskItemID == taskItemID; })[0];
        if (!sourcePost)
            UI.Alert(Resources.Commons.UnexpectedError);
        if (this.viewModel.SelectedTask.TaskData().ActualPermissions.CreateSubtasks != true)
            return false;
        if (this.viewModel.SelectedTask.TaskData().ParentTaskID > 0) {
            UI.Alert(Resources.Subtask.TaskAlreadyChildTask);
            return false;
        }
        if (multipleUsers && $M(this.viewModel.SelectedTask.TaskData().DueDate).diffDays(environmentData.CompanyMoment) < 0) {
            UI.Alert(Resources.Task.SubtaskDueDateInvalid);
            return false;
        }
        this.ResetPostArea(true);
        this.viewModel.SelectedTask.NewPost.FullPost(true);
        var newSubtaskData = {
            ChildTask: null,
            ChildTaskID: null,
            Done: false,
            RealTitle: "",
            SubtaskID: 0,
            TaskID: this.viewModel.ParentTask.TaskID(),
            Title: this.viewModel.ParentTask.TaskTitle(),
            UpdateStatus: null
        };
        this.viewModel.SelectedTask.NewPost.CreateChildTask(newSubtaskData, multipleUsers);
        if (this.allocationControl)
            this.allocationControl.viewModel.NewTaskTitle = newSubtaskData.Title;
        $('.new-task-item .new-owner, .new-task-item .same-owner, .new-task-item .last-owner').hide();
        $('.btgPost').hide();
        $('.subtaskBtn').hide();
        $('.new-task-item').show(0, function () {
            this.ScrollToPostArea();
        }.bind(this));
        this.SetupAttachment();
        this.SetupAttachmentFromExtranet();
        this.SetupRequestType();
        this.viewModel.SelectedTask.NewPost.setDueDate(this.viewModel.SelectedTask.TaskData().DueDate);
        var requestTypeID = sourcePost.RequestTypeID;
        if (!requestTypeID || !_.any(this.viewModel.RequestTypeList(), function (x) { return x.RequestTypeID == requestTypeID; })) {
            requestTypeID = this.viewModel.SelectedTask.TaskData()['RequestTypeID'];
        }
        if (!requestTypeID || !_.any(this.viewModel.RequestTypeList(), function (x) { return x.RequestTypeID == requestTypeID; })) {
            var defaultRequestType = _.filter(this.viewModel.RequestTypeList(), function (x) { return !x.Extranet && x.IsDefault == true; })[0];
            if (defaultRequestType) {
                requestTypeID = defaultRequestType.RequestTypeID;
            }
        }
        this.viewModel.SelectedTask.NewPost.RequestTypeID(requestTypeID);
        if (multipleUsers) {
            this.viewModel.SelectedTask.NewPost.NewOwner(this.serverData.TaskData.Owner);
            $('#SpentTime').val('0');
        }
        else {
            this.viewModel.SelectedTask.NewPost.NewOwner({});
        }
        //carregar descrição do post a partir do post atual e de todos os adjacentes que sejam agrupados
        var currentTaskTaskItems = this.viewModel.SelectedTask.TaskData().NewTaskItems;
        var newTaskTaskItemComment = '';
        for (var i = 0; i < currentTaskTaskItems.length; i++) {
            if (newTaskTaskItemComment == '' && currentTaskTaskItems[i] != sourcePost)
                continue;
            if (currentTaskTaskItems[i] != sourcePost && !currentTaskTaskItems[i].Groupable)
                break;
            if (newTaskTaskItemComment != '')
                newTaskTaskItemComment += '<br/>';
            //newTaskTaskItemComment += ' ';
            newTaskTaskItemComment += currentTaskTaskItems[i].TaskItemComment;
        }
        $("#newTaskItemComment").html(newTaskTaskItemComment);
        this.viewModel.SelectedTask.NewPost.Comment(newTaskTaskItemComment);
        this.viewModel.SelectedTask.NewPost.TaskItemTemplateID(sourcePost.TaskItemTemplateID);
        //carregar anexos
        var attachments = _.map(sourcePost.Attachments, function (x) {
            return {
                TaskAttachmentID: x.TaskAttachmentID,
                Name: x.Name.substring(0, x.Name.lastIndexOf('.')),
                Identification: x.Identification
            };
        });
        this.viewModel.SelectedTask.NewPost.SubtasksCopyTaskAttachments(attachments);
        setTimeout(function (self) {
            $("#newTaskItemComment").focus();
            if (self.viewModel.SelectedTask.TaskData()['ActualPermissions'].ChangeDueDate) {
                Tutorial.ShowNewPostOnce(function () {
                    $("#newTaskItemComment").focus();
                });
            }
        }, 100, this);
        $('.new-task-item .new-owner').show();
        this.viewModel.SelectedTask.NewPost.ForceLoadAllocation(true);
        //para nova tarefa, estado inicial do esforço
        this.ResetEffortEstimationControl();
    };
    //#endregion
    TaskDetail.prototype.ToggleShowSubtasks = function (model) {
        this.viewModel.SelectedTask.ShowSubtasks(!this.viewModel.SelectedTask.ShowSubtasks());
        if (this.viewModel.SelectedTask.ShowSubtasks())
            this.SetupSubtaskKeypress();
    };
    TaskDetail.prototype.SetupRequestType = function () {
        var self = this;
        this.viewModel.CanChangeRequestType(this.serverData.CanChangeRequestType);
        this.viewModel.RequestTypeChangeRequiredParam(this.serverData.RequestTypeChangeRequiredParam);
        this.viewModel.RefreshContextRequestTypeList(this.serverData.RequestTypeList);
        $("select#taskDetailRequestTypeList").off('task:changeRequestType').on('task:changeRequestType', function (e, requestTypeID) {
            var requestType = _.filter(self.viewModel.RequestTypeList(), function (x) { return x.RequestTypeID == requestTypeID; })[0];
            if (requestType && self.viewModel.ResetOnRequestTypeChange() && self.viewModel.PipelineSteps().length > 0) {
                var firstStep = self.viewModel.PipelineSteps()[0];
                var currentStepID = self.viewModel.SelectedTask.TaskData().PipelineStepID;
                if (firstStep && firstStep.PipelineStepID != currentStepID) {
                    self.viewModel.SelectedTask.NewPost.PipelineStepID(firstStep.PipelineStepID);
                    self.viewModel.SelectedTask.NewPost.PipelineStepRestarted(true);
                    $('#resetPipelineIcon').tooltip();
                }
            }
            else
                self.viewModel.SelectedTask.NewPost.PipelineStepRestarted(false);
            var dynFormMetadata = self.viewModel.RequestTypeForm();
            if (dynFormMetadata) {
                var dynFormContainer = $("#dynFormContainer")[0];
                self.dynForm.Init(dynFormContainer, dynFormMetadata, 'dynForm', false, requestType.DynFormHint);
            }
            else
                self.dynForm.Reset();
        });
        $("select#taskDetailRequestTypeList").off('task:applytemplate').on('task:applytemplate', function (e, requestTypeID) {
            var requestType = _.filter(self.viewModel.RequestTypeList(), function (x) { return x.RequestTypeID == requestTypeID; })[0];
            if (requestType && requestType.Content && requestType.Content.length > 0 && !self.viewModel.RequestTypeForm()) {
                self.commentArea.ApplyTemplate(requestType.Content, false);
                self.ReloadTaskComment();
            }
        });
    };
    TaskDetail.prototype.CloseAllSubtasks = function () {
        var self = this;
        if (this.viewModel.ParentTask.SubtasksInProgress().length == 0) {
            UI.Alert(Resources.Task.SubtasksNotFound);
            return false;
        }
        var parentTask = _.filter(this.siblingsTasks, function (x) { return x.TaskID == this.viewModel.ParentTask.TaskID(); }, this)[0];
        if (!parentTask) {
            UI.Alert(Resources.Task.ErrorOnSave);
            return false;
        }
        UI.ConfirmYesNo(Resources.Task.ConfirmCloseAllSubtasks, function () {
            var failCallback = function (response) {
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false) {
                    return failCallback(response);
                }
                self.ReloadTask();
                $('#btnSaveTaskHeader').button('reset');
                taskrow.HideLoading();
            };
            taskrow.DisplayLoading();
            $.ajax({ url: '/Task/CloseAllSubtasks', data: { jobNumber: self.serverData.JobData.JobNumber, taskNumber: parentTask.TaskNumber, rowVersion: parentTask.RowVersion, currentConnectionID: $.connection.hub.id }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        });
    };
    TaskDetail.prototype.ShowImagesThumbs = function (showThumbs) {
        var self = this;
        this.viewModel.SelectedTask.ShowThumbs(showThumbs);
        setTimeout(function () {
            self.SetupHideTaskAttachments();
        }, 10);
    };
    TaskDetail.prototype.ShowExternalImagesThumbs = function (showThumbs) {
        var self = this;
        this.viewModel.SelectedTask.ShowExternalThumbs(showThumbs);
        setTimeout(function () {
            self.SetupHideExternalTaskAttachments();
        }, 10);
    };
    TaskDetail.prototype.SetupHideTaskAttachments = function () {
        //images
        var containerImages = $('#containerTaskImages');
        var hideImages = (containerImages.length > 0 && containerImages.find('#taskImagesThumbs').outerHeight() > containerImages.outerHeight() && this.viewModel.SelectedTask.ShowThumbs());
        this.viewModel.SelectedTask.CanHideTaskImages(hideImages);
        this.viewModel.SelectedTask.HideTaskImages(hideImages);
        //images list
        var containerImagesList = $('#containerTaskImagesList');
        var hideImagesList = (containerImagesList.length > 0 && containerImagesList.find('#taskImagesList').outerHeight() > containerImagesList.outerHeight() && !this.viewModel.SelectedTask.ShowThumbs());
        this.viewModel.SelectedTask.CanHideTaskImagesList(hideImagesList);
        this.viewModel.SelectedTask.HideTaskImagesList(hideImagesList);
        //attachments
        var containerAttachments = $('#containerTaskAttachments');
        var hideAttachments = containerAttachments.length > 0 && containerAttachments.find('#taskAttachmentsList').outerHeight() > containerAttachments.outerHeight();
        this.viewModel.SelectedTask.CanHideTaskAttachments(hideAttachments);
        this.viewModel.SelectedTask.HideTaskAttachments(hideAttachments);
    };
    TaskDetail.prototype.SetupHideExternalTaskAttachments = function () {
        //images
        var containerImages = $('#containerExternalTaskImages');
        var hideImages = (containerImages.length > 0 && containerImages.find('#externalImagesThumbs').outerHeight() > containerImages.outerHeight() && this.viewModel.SelectedTask.ShowExternalThumbs());
        this.viewModel.SelectedTask.CanHideExternalTaskImages(hideImages);
        this.viewModel.SelectedTask.HideExternalTaskImages(hideImages);
        //images list
        var containerImagesList = $('#containerExternalTaskImagesList');
        var hideImagesList = (containerImagesList.length > 0 && containerImagesList.find('#externalImagesList').outerHeight() > containerImagesList.outerHeight() && !this.viewModel.SelectedTask.ShowExternalThumbs());
        this.viewModel.SelectedTask.CanHideExternalTaskImagesList(hideImagesList);
        this.viewModel.SelectedTask.HideExternalTaskImagesList(hideImagesList);
        //attachments
        var containerAttachments = $('#containerExternalTaskAttachments');
        var hideAttachments = containerAttachments.length > 0 && containerAttachments.find('#externalAttachmentsList').outerHeight() > containerAttachments.outerHeight();
        this.viewModel.SelectedTask.CanHideExternalTaskAttachments(hideAttachments);
        this.viewModel.SelectedTask.HideExternalTaskAttachments(hideAttachments);
    };
    TaskDetail.prototype.CopyPostFromExtranet = function (sourcePost) {
        if (!this.viewModel.SelectedTask.TaskData().ActualPermissions.CanForwardTask)
            return false;
        this.ResetPostArea(true);
        this.BeginForward();
        //carregar descrição do post
        $("#newTaskItemComment").html(sourcePost.TaskItemComment);
        this.viewModel.SelectedTask.NewPost.Comment(sourcePost.TaskItemComment);
        //carregar anexos
        var attachments = _.map(sourcePost.Attachments, function (attachment) {
            return _.extend(attachment, { Name: (attachment.Name.lastIndexOf('.') > -1) ? attachment.Name.substring(0, attachment.Name.lastIndexOf('.')) : attachment.Name });
        }, this);
        this.viewModel.SelectedTask.NewPost.ExistingAttachments(attachments);
        setTimeout(function (self) {
            $("#newTaskItemComment").focus();
            if (self.viewModel.SelectedTask.TaskData()['ActualPermissions'].ChangeDueDate) {
                Tutorial.ShowNewPostOnce(function () {
                    $("#newTaskItemComment").focus();
                });
            }
        }, 100, this);
        //voltar a aba principal
        this.viewModel.ExtranetOpen(false);
    };
    TaskDetail.prototype.CalcTaskDetailWidth = function () {
        var $taskdetail = $('.task-details');
        var $subtaskDropDown = $('.subtask-droplist');
        if ($taskdetail && $taskdetail.length > 0 && $subtaskDropDown && $subtaskDropDown.length > 0) {
            if ($subtaskDropDown.is(':visible')) {
                var subtaskDropdownHeight = $subtaskDropDown.outerHeight(true);
                var subtaskDropdownOffsetTop = $subtaskDropDown.offset()['top'];
                var taskDetailOffsetTop = $taskdetail.offset()['top'];
                var minHeight = (subtaskDropdownHeight + (subtaskDropdownOffsetTop - taskDetailOffsetTop));
                $taskdetail.attr('style', 'min-height: ' + minHeight + 'px;');
            }
            else
                $taskdetail.attr('style', 'min-height: none;');
        }
    };
    TaskDetail.prototype.ToggleShowAttachmentGallery = function () {
        this.viewModel.SelectedTask.ShowAttachmentGallery(!this.viewModel.SelectedTask.ShowAttachmentGallery());
    };
    //#region Status extranet
    TaskDetail.prototype.CloseOrReopenExtranet = function (close) {
        var self = this;
        var data = this.viewModel.SelectedTask.TaskData();
        var jobData = this.viewModel.Job();
        UI.ConfirmYesNo(close ? Resources.Task.ExtranetConfirmClosing : Resources.Task.ExtranetConfirmReopen, function (ok) {
            if (!ok)
                return;
            taskrow.DisplayLoading();
            var failCallback = function (response) {
                taskrow.HideLoading();
                UI.Alert(response.Message);
                return false;
            };
            var successCallback = function (response) {
                if (response.Success === false)
                    return failCallback(response);
                self.ReloadTask();
                taskrow.HideLoading();
            };
            $.ajax({ url: '/Task/CloseOrReopenExtranet', data: { jobNumber: jobData.JobNumber, taskNumber: data.TaskNumber, rowVersion: data.RowVersion, close: close }, method: 'post' })
                .fail(failCallback)
                .done(successCallback);
        });
    };
    return TaskDetail;
}());
//Viewmodel da tela inteira
var TaskDetailViewModel = /** @class */ (function () {
    function TaskDetailViewModel(data, taskUrlType, aditionalTaskUrlParams) {
        var _this = this;
        var self = this;
        this.TaskUrlType = ko.observable(taskUrlType);
        this.AditionalTaskUrlParams = ko.observable(aditionalTaskUrlParams);
        this.Job = ko.observable({});
        this.ContextTaskTags = ko.observableArray([]);
        this.AllocationControlLoaded = ko.observable(false);
        this.RequiredTimesheet = ko.observable(true);
        this.PipelineSteps = ko.observableArray([]);
        this.ExtranetPipelineSteps = ko.observableArray([]);
        this.ResetOnRequestTypeChange = ko.observable(false);
        this.ExtranetOpen = ko.observable(false);
        this.ExtranetOpen.subscribe(function (newValue) {
            if (newValue) {
                $('#divTaskItems').hide();
                if (_this.NoContacts())
                    $('#divExtranetWithoutUsers').show();
                else
                    $('#divExternalTaskItems').show();
            }
            else {
                if (_this.NoContacts())
                    $('#divExtranetWithoutUsers').hide();
                else
                    $('#divExternalTaskItems').hide();
                $('#divTaskItems').show();
            }
            $('#spnContactMembersInvalid').hide();
        }, this);
        this.NoContacts = ko.observable(false);
        this.NewExternalTaskItem = new NewExternalTaskItemViewModel();
        this.DeliverableDetails = new DeliverableDetailsViewModel();
        this.ParentTask = new ParentTaskViewModel();
        this.SelectedTask = new TaskViewModel(data.TaskData, data.JobData, this.TaskUrlType(), this.AditionalTaskUrlParams());
        this.RequestTypeList = ko.observableArray([]);
        this.PipelineSteps.subscribe(function () {
            _this.SelectedTask.PipelineSteps(_this.PipelineSteps());
        });
        this.ContextRequestTypeList = ko.observableArray([]);
        this.CanChangeRequestType = ko.observable(false);
        this.RequestTypeChangeRequiredParam = ko.observable(false);
        this.MaxTaskItemID = ko.computed(function () {
            var selectedTask = self.SelectedTask.TaskData();
            if (selectedTask)
                return _.chain(selectedTask.NewTaskItems).pluck('TaskItemID').max().value();
            return 0;
        });
        this.ShowRequestTypeList = ko.computed(function () {
            var newPostAction = this.SelectedTask.NewPost.PostAction();
            var hasRequestType = this.RequestTypeList().length > 0;
            var canChangeRequestType = this.CanChangeRequestType();
            var requestTypeChangeRequiredParam = this.RequestTypeChangeRequiredParam();
            var isCurrentOwner = this.SelectedTask.TaskData().Owner.UserID == environmentData.currentUserID;
            //Exibir RequestType quando            
            return (
            //está criando subtarefas (requestType é obrigatório em novas tarefas)
            newPostAction == NewPostAction.ChildTask
                ||
                    (
                    //Existe algum RequestType disponível e pode alterar o requestType (criador ou possui permissão alterar de terceiros)
                    hasRequestType && canChangeRequestType
                        //E é o atual responsável ou é o criador da tarefa
                        && (isCurrentOwner || !requestTypeChangeRequiredParam)
                        //E está encaminhando/respondendo ou está comentando e empresa não obriga mudar ao encaminhar (parametro RequestTypeChangeRequired da empresa é false)
                        && (newPostAction == NewPostAction.Answer || newPostAction == NewPostAction.Forward || (!requestTypeChangeRequiredParam && newPostAction == NewPostAction.Comment))));
        }, this);
        this.LastPipelineStepID = ko.computed(function () {
            var steps = this.PipelineSteps();
            if (!steps || steps.length == 0)
                return 0;
            var curStep = steps[steps.length - 1];
            return curStep.PipelineStepID;
        }, this);
        this.LastExtranetPipelineStepID = ko.computed(function () {
            var steps = this.ExtranetPipelineSteps();
            if (!steps || steps.length == 0)
                return 0;
            var curStep = steps[steps.length - 1];
            return curStep.PipelineStepID;
        }, this);
        this.RequestTypeForm = ko.computed(function () {
            if (_this.SelectedTask.NewPost.MultipleOwners())
                return undefined;
            var id = _this.SelectedTask.NewPost.RequestTypeID();
            if (!id)
                return undefined;
            var requestType = _this.RequestTypeList().filter(function (x) { return x.RequestTypeID == +id; })[0];
            if (!requestType || !requestType.DynFormMetadata)
                return undefined;
            return JSON.parse(requestType.DynFormMetadata);
        }, this);
        this.DateFormat = ko.observable(LocalStorage.Get('taskdetail_dateformat') || 1);
        this.DateFormat.subscribe(function (val) {
            LocalStorage.Set('taskdetail_dateformat', val || 1);
        });
        this.refreshData(data);
    }
    TaskDetailViewModel.prototype.toogleDateFormat = function () {
        console.log('dateformat atual', this.DateFormat());
        this.DateFormat(this.DateFormat() == 1 ? 2 : 1);
    };
    TaskDetailViewModel.prototype.refreshParentTask = function (taskData) {
        var parentTaskData = (taskData.ParentTask != null) ? taskData.ParentTask : taskData;
        this.ParentTask.refreshData(parentTaskData);
    };
    TaskDetailViewModel.prototype.refreshData = function (data) {
        this.Job(data.JobData);
        this.ContextTaskTags(data.ContextTaskTags);
        this.RequiredTimesheet(data.RequiredTimesheet);
        this.PipelineSteps(data.Pipeline.PipelineSteps);
        this.ExtranetPipelineSteps(data.ExtranetPipeline.PipelineSteps);
        this.ResetOnRequestTypeChange(data.Pipeline.ResetOnRequestTypeChange);
        this.DeliverableDetails.RefreshData(data.TaskData.Deliverable);
        this.StepTitleWidth = ko.computed(function () {
            var max = _.chain(this.PipelineSteps()).pluck('Title').map(function (x) { return x.length; }).max().value();
            return Math.max(80, Math.floor(30 + max * 5));
        }, this);
        this.ExtranetStepTitleWidth = ko.computed(function () {
            var max = _.chain(this.ExtranetPipelineSteps()).pluck('Title').map(function (x) { return x.length; }).max().value();
            return Math.max(80, Math.floor(30 + max * 5));
        }, this);
        this.SelectedTask.refreshData(data.TaskData);
        this.refreshParentTask(data.TaskData);
        this.refreshExternalTaskItem(data.TaskData);
    };
    TaskDetailViewModel.prototype.refreshExternalTaskItem = function (data) {
        this.NewExternalTaskItem.MemberContacts(_(data.ExternalMembers).pluck('Contact'));
        this.NewExternalTaskItem.NotifyContacts(_(data.ExternalMembers).pluck('Contact'));
        this.NewExternalTaskItem.ToClientContact(null);
        this.NewExternalTaskItem.ExtranetPipelineStepID(data.ExtranetPipelineStepID);
        this.SetupLastToClientContact(data);
    };
    TaskDetailViewModel.prototype.SetupLastToClientContact = function (data) {
        var lastContact = _(data.ExternalTaskItems).chain().pluck('FromContact').compact().last().value();
        if (!lastContact)
            lastContact = _(data.ExternalTaskItems).chain().pluck('ToContact').compact().last().value();
        if (lastContact) {
            this.NewExternalTaskItem.ToClientContact(lastContact);
            this.NewExternalTaskItem.InitialToClientContact = lastContact;
        }
    };
    TaskDetailViewModel.prototype.RefreshContextRequestTypeList = function (data) {
        var self = this;
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
        var requestTypeList = data;
        if (this.SelectedTask.NewPost.PostAction() != NewPostAction.ChildTask) {
            requestTypeList = _.filter(data, function (x) { return x.InitialType == false; });
            _.each(requestTypeList, function (rt) {
                if (!rt.SingleUse)
                    return;
                var requestTypeUsed = (_.any(self.SelectedTask.TaskData().NewTaskItems, function (ti) { return ti.RequestTypeID == rt.RequestTypeID; }));
                if (requestTypeUsed)
                    requestTypeList = _.without(requestTypeList, _.findWhere(requestTypeList, { 'RequestTypeID': rt.RequestTypeID }));
            });
        }
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
        self.RequestTypeList(requestTypeList);
        self.ContextRequestTypeList(contextRequestTypeList);
    };
    TaskDetailViewModel.prototype.GetCurrentStepTitle = function (stepID) {
        stepID = stepID || this.SelectedTask.TaskData()['PipelineStepID'];
        return this.GetStepTitle(stepID);
    };
    TaskDetailViewModel.prototype.GetStepTitle = function (stepID) {
        if (!stepID)
            return '';
        var step = _(this.PipelineSteps()).findWhere({ PipelineStepID: stepID });
        if (step)
            return step.Title;
        return '';
    };
    TaskDetailViewModel.prototype.GetNewStepTitle = function () {
        return this.GetCurrentStepTitle(this.SelectedTask.NewPost.PipelineStepID());
    };
    TaskDetailViewModel.prototype.ChangeStepNext = function () {
        var steps = this.PipelineSteps();
        var stepID = this.SelectedTask.NewPost.PipelineStepID() || this.SelectedTask.TaskData()['PipelineStepID'];
        var curStep = _(steps).findWhere({ PipelineStepID: stepID });
        var ix = steps.indexOf(curStep) + 1;
        if (ix >= steps.length)
            return;
        curStep = steps[ix];
        this.SelectedTask.NewPost.PipelineStepID(curStep.PipelineStepID);
    };
    TaskDetailViewModel.prototype.ChangeStepLast = function () {
        var steps = this.PipelineSteps();
        var curStep = steps[steps.length - 1];
        this.SelectedTask.NewPost.PipelineStepID(curStep.PipelineStepID);
    };
    TaskDetailViewModel.prototype.ChangeStepFirst = function () {
        var steps = this.PipelineSteps();
        var curStep = steps[0];
        this.SelectedTask.NewPost.PipelineStepID(curStep.PipelineStepID);
    };
    TaskDetailViewModel.prototype.ChangeStepPrev = function () {
        var steps = this.PipelineSteps();
        var stepID = this.SelectedTask.NewPost.PipelineStepID() || this.SelectedTask.TaskData()['PipelineStepID'];
        var curStep = _(steps).findWhere({ PipelineStepID: stepID });
        var ix = steps.indexOf(curStep) - 1;
        if (ix < 0)
            return;
        curStep = steps[ix];
        this.SelectedTask.NewPost.PipelineStepID(curStep.PipelineStepID);
    };
    TaskDetailViewModel.prototype.IsNextStepEnabled = function () {
        var steps = this.PipelineSteps();
        var stepID = this.SelectedTask.NewPost.PipelineStepID();
        return steps[steps.length - 1].PipelineStepID !== stepID;
    };
    TaskDetailViewModel.prototype.IsPrevStepEnabled = function () {
        var steps = this.PipelineSteps();
        var stepID = this.SelectedTask.NewPost.PipelineStepID();
        return steps[0].PipelineStepID !== stepID;
    };
    TaskDetailViewModel.prototype.GetExtranetStepTitle = function (stepID) {
        if (!stepID)
            return '';
        var step = _(this.ExtranetPipelineSteps()).findWhere({ PipelineStepID: stepID });
        if (step)
            return step.Title;
        return '';
    };
    TaskDetailViewModel.prototype.GetNewExtranetStepTitle = function () {
        return this.GetExtranetStepTitle(this.NewExternalTaskItem.ExtranetPipelineStepID());
    };
    TaskDetailViewModel.prototype.ChangeExtranetStepNext = function () {
        var steps = this.ExtranetPipelineSteps();
        var stepID = this.NewExternalTaskItem.ExtranetPipelineStepID() || this.SelectedTask.TaskData()['ExtranetPipelineStepID'];
        var curStep = _(steps).findWhere({ PipelineStepID: stepID });
        var ix = steps.indexOf(curStep) + 1;
        if (ix >= steps.length)
            return;
        curStep = steps[ix];
        this.NewExternalTaskItem.ExtranetPipelineStepID(curStep.PipelineStepID);
    };
    TaskDetailViewModel.prototype.ChangeExtranetStepPrev = function () {
        var steps = this.ExtranetPipelineSteps();
        var stepID = this.NewExternalTaskItem.ExtranetPipelineStepID() || this.SelectedTask.TaskData()['ExtranetPipelineStepID'];
        var curStep = _(steps).findWhere({ PipelineStepID: stepID });
        var ix = steps.indexOf(curStep) - 1;
        if (ix < 0)
            return;
        curStep = steps[ix];
        this.NewExternalTaskItem.ExtranetPipelineStepID(curStep.PipelineStepID);
    };
    TaskDetailViewModel.prototype.ChangeExtranetStepLast = function () {
        var steps = this.ExtranetPipelineSteps();
        var curStep = steps[steps.length - 1];
        this.NewExternalTaskItem.ExtranetPipelineStepID(curStep.PipelineStepID);
    };
    TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE = 3;
    return TaskDetailViewModel;
}());
//Viewmodel da tarefa principal
var ParentTaskViewModel = /** @class */ (function () {
    function ParentTaskViewModel(data) {
        this.TaskID = ko.observable();
        this.TaskNumber = ko.observable();
        this.TaskTitle = ko.observable('');
        this.RequestTypeAcronym = ko.observable('');
        this.ExternalRequest = ko.observable(false);
        this.ExtranetCloseRequested = ko.observable(false);
        this.ExtranetClosed = ko.observable(false);
        this.Deliverable = ko.observable(null);
        this.Tags = ko.observableArray([]);
        this.Subtasks = ko.observableArray([]);
        this.HasChildTasks = ko.computed(function () {
            return this.Subtasks().length > 0;
        }, this);
        if (data)
            this.refreshData(data);
    }
    ParentTaskViewModel.prototype.refreshData = function (data) {
        this.TaskID(data.TaskID);
        this.TaskNumber(data.TaskNumber);
        this.TaskTitle(data.TaskTitle);
        this.RequestTypeAcronym(data.RequestTypeAcronym);
        this.ExternalRequest(data.ExternalRequest);
        this.ExtranetCloseRequested(data.ExtranetCloseRequested);
        this.ExtranetClosed(data.ExtranetClosed);
        this.Deliverable(data.Deliverable);
        this.Tags.removeAll();
        _.each(data.Tags, function (tag) {
            var colorCss = 'badge-color' + (tag.ColorID > 0 ? tag.ColorID : '');
            tag.ColorCss = ko.observable(colorCss);
        }, this);
        this.Tags(data.Tags);
        this.Subtasks.removeAll();
        _.each(data.Subtasks, function (sub) {
            if (!sub.ChildTask)
                return;
            this.Subtasks.push(sub.ChildTask);
        }, this);
        this.HasChildTasks = ko.computed(function () {
            return this.Subtasks().length > 0;
        }, this);
        this.SubtasksInProgress = ko.computed(function () {
            return _.filter(this.Subtasks(), function (sub) { return sub.TaskID > 0 && !sub.Closed; });
        }, this);
        this.SubtasksClosed = ko.computed(function () {
            return _.filter(this.Subtasks(), function (sub) { return sub.TaskID > 0 && sub.Closed; });
        }, this);
    };
    return ParentTaskViewModel;
}());
//Viewmodel de uma tarefa qualquer
var TaskViewModel = /** @class */ (function () {
    function TaskViewModel(data, jobData, taskUrlType, aditionalTaskUrlParams) {
        var _this = this;
        this.TaskUrlType = ko.observable(taskUrlType);
        this.AditionalTaskUrlParams = ko.observable(aditionalTaskUrlParams);
        this.TaskData = ko.observable({});
        this.JobData = ko.observable({});
        this.TaskTitle = ko.observable("");
        this.RequestTypeAcronym = ko.observable("");
        this.NewPost = new NewTaskItem(this.TaskData);
        this.Members = ko.observableArray([]);
        this.PreviousEffortEstimation = ko.observable(undefined);
        this.PreviousEffortUnitListString = ko.observable(undefined);
        this.CurrentPostEffortEstimation = ko.observable(undefined);
        this.CurrentPostEffortUnitListString = ko.observable(undefined);
        this.EffortEstimation = ko.observable(undefined);
        this.EffortUnitListString = ko.observable(undefined);
        this.TaskAttachments = ko.observableArray([]);
        this.CanHideTaskAttachments = ko.observable(true);
        this.HideTaskAttachments = ko.observable(true);
        this.TaskImages = ko.observableArray([]);
        this.ShowThumbs = ko.observable(true);
        this.CanHideTaskImages = ko.observable(true);
        this.HideTaskImages = ko.observable(true);
        this.CanHideTaskImagesList = ko.observable(true);
        this.HideTaskImagesList = ko.observable(true);
        this.ExternalAttachments = ko.observableArray([]);
        this.ExternalImages = ko.observableArray([]);
        this.PreviousScrollTop = ko.observable(window.scrollY);
        this.AcceptRequestType = ko.observable(false);
        this.PipelineSteps = ko.observableArray([]);
        this.NotificationUsers = ko.computed(function () {
            var taskData = this.TaskData();
            if (!taskData.Owner)
                return [];
            var ret = [];
            if (environmentData.currentUserID != taskData.Owner.UserID
                && _.where(ret, { 'UserID': taskData.Owner.UserID }).length == 0)
                ret.push(taskData.Owner);
            if (taskData.LastForwardUser
                && environmentData.currentUserID != taskData.LastForwardUser.UserID
                && _.where(ret, { 'UserID': taskData.LastForwardUser.UserID }).length == 0)
                ret.push(taskData.LastForwardUser);
            var alwaysNotifyUsers = _.where(taskData.Members, { "Notify": true });
            for (var i = 0; i < alwaysNotifyUsers.length; i++) {
                var member = alwaysNotifyUsers[i];
                if (member.UserID != environmentData.currentUserID
                    && _.where(ret, { "UserID": member.UserID }).length == 0)
                    ret.push(member);
            }
            if (this.NewPost.ActualOwner() && this.NewPost.ActualOwner().UserID
                && this.NewPost.ActualOwner().UserID != environmentData.currentUserID
                && _.where(ret, { "UserID": this.NewPost.ActualOwner().UserID }).length == 0) {
                ret.push(this.NewPost.ActualOwner());
            }
            return ret;
        }, this);
        this.SmallRelativeURL = ko.observable(environmentData.userMask.SmallRelativeURL);
        this.Status = ko.computed(function () {
            return this.TaskData()['Closed'] ? Resources.Task.Closed : Resources.Task.Open;
        }, this);
        //subtasks
        this.Subtasks = ko.observableArray([]);
        this.SubtasksSaved = ko.computed(function () {
            return _.filter(this.Subtasks(), function (x) { return x.SubtaskID() > 0; });
        }, this);
        this.ShowSubtasks = ko.observable(false);
        this.LastReadDate = ko.computed(function () {
            var members = this.Members();
            var currentMember = _.findWhere(members, { 'UserID': environmentData.currentUserID });
            if (currentMember)
                return currentMember.LastReadDate;
            return null;
        }, this);
        this.FirstUnreadTaskItem = ko.computed(function () {
            var _this = this;
            if (!this.LastReadDate())
                return null;
            var items = this.TaskData().NewTaskItems;
            var firstItem = _(items).find(function (x) { return x.Date > _this.LastReadDate(); });
            if (firstItem && _(items).indexOf(firstItem) == 0)
                return null;
            return firstItem;
        }, this);
        this.LastRequestTypeItemIndex = ko.computed(function () {
            if (!this.TaskData() || !this.TaskData().NewTaskItems)
                return 0;
            var taskItemList = this.TaskData().NewTaskItems;
            var lastTaskItemWithRequestType = _.chain(taskItemList)
                .filter(function (ti) { return ti.RequestTypeID > 0; })
                .sortBy(function (ti) { return ti.TaskItemID; })
                .last()
                .value();
            if (lastTaskItemWithRequestType)
                return _.indexOf(taskItemList, lastTaskItemWithRequestType);
            return 0;
        }, this);
        this.HideMiddleExternalPostsStatus = ko.observable(true);
        this.HideMiddleExternalPosts = ko.computed(function () {
            if (this.TaskData() && this.TaskData().ExternalTaskItems)
                return this.TaskData().ExternalTaskItems.length > 4;
            return false;
        }, this);
        this.HideExternalPostsCount = ko.computed(function () {
            var count = 0;
            var discountItemsCount = 3;
            if (this.TaskData() && this.TaskData().ExternalTaskItems)
                count = this.TaskData().ExternalTaskItems.length;
            return count - discountItemsCount;
        }, this);
        this.ShowAttachmentGallery = ko.observable(false);
        this.ShowExternalThumbs = ko.observable(true);
        this.CanHideExternalTaskImages = ko.observable(true);
        this.HideExternalTaskImages = ko.observable(true);
        this.CanHideExternalTaskImagesList = ko.observable(true);
        this.HideExternalTaskImagesList = ko.observable(true);
        this.CanHideExternalTaskAttachments = ko.observable(true);
        this.HideExternalTaskAttachments = ko.observable(true);
        this.NotifyMe = ko.observable(false);
        this.Favorite = ko.observable(false);
        this.Follow = ko.observable(true);
        this.ExtranetPending = ko.observable(false);
        this.ExternalMembersReadCount = ko.observable(0);
        this.ExtranetStatusText = ko.computed(function () {
            if (this.TaskData()) {
                if (this.TaskData().Closed || this.TaskData().ExtranetClosed)
                    return Resources.Task.ExtranetClosed;
                else if (this.TaskData().ExtranetCloseRequested)
                    return Resources.Task.ExtranetCloseRequested;
                return Resources.Task.ExtranetOpened;
            }
            return '';
        }, this);
        this.ExpandedRequests = ko.observable({});
        this.ExpandedTaskItems = ko.observable({});
        this.refreshData(data, jobData);
        this.Requests = ko.pureComputed(function () {
            _this.PreviousScrollTop(window.scrollY);
            var list = $('#taskRequestsList');
            if (list.length)
                list.css('min-height', list[0].scrollHeight + 'px');
            var items = _this.TaskData().NewTaskItems;
            var options = { aditionalTaskUrlParams: _this.AditionalTaskUrlParams(), taskUrlType: _this.TaskUrlType() };
            var toggles = { expandedTaskItems: _this.ExpandedTaskItems(), expandedRequests: _this.ExpandedRequests(), lastReadDate: $M(_this.LastReadDate()) };
            return TaskViewModel.buildRequestList(items, _this.TaskData(), _this.JobData(), _this.PipelineSteps(), options, toggles);
        }, this);
        this.Requests.subscribe(function () {
            setTimeout(function () {
                window.scrollTo(window.scrollX, _this.PreviousScrollTop());
                var list = $('#taskRequestsList');
                if (list.length)
                    list.css('min-height', 0 + 'px');
            }, 0);
            console.log('scrollando para ', window.scrollY, _this.PreviousScrollTop());
        });
    }
    TaskViewModel.prototype.toggleShowTaskAttachments = function () {
        this.HideTaskAttachments(!this.HideTaskAttachments());
    };
    TaskViewModel.prototype.toggleShowTaskImages = function () {
        this.HideTaskImages(!this.HideTaskImages());
    };
    TaskViewModel.prototype.toggleShowTaskImagesList = function () {
        this.HideTaskImagesList(!this.HideTaskImagesList());
    };
    TaskViewModel.prototype.toggleShowExternalTaskAttachments = function () {
        this.HideExternalTaskAttachments(!this.HideExternalTaskAttachments());
    };
    TaskViewModel.prototype.toggleShowExternalTaskImages = function () {
        this.HideExternalTaskImages(!this.HideExternalTaskImages());
    };
    TaskViewModel.prototype.toggleShowExternalTaskImagesList = function () {
        this.HideExternalTaskImagesList(!this.HideExternalTaskImagesList());
    };
    TaskViewModel.prototype.toggleTaskItemExpanded = function (ti) {
        var openItems = __assign({}, this.ExpandedTaskItems());
        openItems[ti.taskItemID] = !openItems[ti.taskItemID];
        this.ExpandedTaskItems(openItems);
        return true;
    };
    TaskViewModel.prototype.toggleRequestOpen = function (requestIndex) {
        var expandedRequests = __assign({}, this.ExpandedRequests());
        expandedRequests[requestIndex] = !expandedRequests[requestIndex];
        this.ExpandedRequests(expandedRequests);
        return true;
    };
    TaskViewModel.prototype.refreshData = function (data, jobData, callback) {
        if (!data.ActualPermissions && this.TaskData().ActualPermissions)
            data.ActualPermissions = _.clone(this.TaskData().ActualPermissions);
        if (data.ExternalTaskItems && data.ExternalTaskItems.length > 0)
            data.ExternalTaskItems = this.verifyExternalTaskItemComment(data.ExternalTaskItems);
        this.TaskData(data);
        if (jobData)
            this.JobData(jobData);
        this.TaskTitle(data.TaskTitle);
        this.RequestTypeAcronym(data.RequestTypeAcronym);
        this.NewPost.TaskData(data);
        this.AcceptRequestType(data.AcceptRequestType);
        this.TaskAttachments.removeAll();
        this.TaskImages.removeAll();
        if (data.TaskAttachments && data.TaskAttachments.length > 0) {
            this.TaskAttachments(_.filter(data.TaskAttachments, function (attachment) { return attachment.AttachmentTypeID != TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
            this.TaskImages(_.filter(data.TaskAttachments, function (attachment) { return attachment.AttachmentTypeID == TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
        }
        this.ExternalAttachments.removeAll();
        this.ExternalImages.removeAll();
        if (data.ExternalAttachments && data.ExternalAttachments.length > 0) {
            this.ExternalAttachments(_.filter(data.ExternalAttachments, function (attachment) { return attachment.AttachmentTypeID != TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
            this.ExternalImages(_.filter(data.ExternalAttachments, function (attachment) { return attachment.AttachmentTypeID == TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
        }
        this.Members(data.Members);
        //não recarregar data, usuarios e esforço se post aberto seja de criação de subtarefa
        if (this.NewPost.PostAction() != NewPostAction.ChildTask) {
            this.NewPost.setDueDate(data.DueDate);
            this.NewPost.NotificationUsers.removeAll();
            this.EffortEstimation(data.EffortEstimation);
            this.EffortUnitListString(data.EffortUnitListString);
        }
        this.PreviousEffortEstimation(data.EffortEstimation);
        this.PreviousEffortUnitListString(data.EffortUnitListString);
        this.Subtasks.removeAll();
        if (data.Subtasks.length > 0) {
            _.each(_.sortBy(data.Subtasks, function (x) { return x.SubtaskID; }), function (sub) {
                var subtaskModel = new SubtaskViewModel();
                subtaskModel.refreshData(sub);
                this.Subtasks.push(subtaskModel);
            }, this);
            var newsubtask = new SubtaskViewModel(data.TaskID);
            this.Subtasks.push(newsubtask);
        }
        this.NotifyMe(data.NotifyMe);
        this.Favorite(data.Favorite);
        this.Follow(data.Follow);
        this.ExtranetPending(data.ExtranetPending);
        if (data.ExternalMembers.length > 0)
            this.ExternalMembersReadCount(_.filter(data.ExternalMembers, function (x) { return x.Read; }).length);
        if (callback)
            callback();
    };
    TaskViewModel.prototype.verifyExternalTaskItemComment = function (items) {
        var length = items.length - 1;
        var count = 0;
        var targetCount = 2;
        for (var i = length; i >= 0; i--) {
            var currentItem = items[i];
            currentItem.NoCollapse = true;
            count++;
            if (count == targetCount)
                i = -1;
        }
        return items;
    };
    TaskViewModel.buildRequestList = function (taskItems, taskData, jobData, pipelineSteps, options, toggles) {
        var ret = [];
        if (!taskItems)
            return ret;
        console.log('buildRequestList', taskItems);
        var maxVisibleItemsOnPartialRequests = 5;
        var requestTypeIDSequences = {};
        var currentRequest = undefined;
        var getRequestSequence = function (requestTypeID) { return requestTypeIDSequences[requestTypeID]
            = (requestTypeIDSequences[requestTypeID] ? requestTypeIDSequences[requestTypeID] + 1 : 1); };
        //task creator / previous owner
        var previousNewUserID = (taskItems[0] || {}).OldOwnerUserID;
        var previousFromUserID = undefined;
        var previousDate = undefined;
        var newItemsStamped = false;
        var expandedTaskItems = toggles.expandedTaskItems, expandedRequests = toggles.expandedRequests, lastReadDate = toggles.lastReadDate;
        var setupPartialRequest = function (req) {
            if (req.state != TaskDetailRequestState.Partial)
                return;
            req.items.forEach(function (val, index) {
                val.alwaysVisible = index == 0 || index >= req.items.length - 2 || (val.date.diff(lastReadDate, 's') > 0);
            });
            req.colapsedItems = req.items.filter(function (x) { return !x.alwaysVisible; }).length;
        };
        var getPipelineStepTitle = function (stepID) {
            if (!stepID)
                return '';
            var step = _(pipelineSteps).findWhere({ PipelineStepID: stepID });
            if (step)
                return step.Title;
            return '';
        };
        var buildOwnerChangeItem = function (item, viewItem) {
            if (item.TaskItemAction == EnumTaskItemAction.Forward && ret.length == 1 && currentRequest.items.length == 0) {
                var forward = {
                    text: Resources.Task.CreatedTaskTo + " " + item.NewOwnerName,
                    target: getNewOwner(),
                    iconClass: 'icon-arrow-right'
                };
                newItem = __assign({}, viewItem, { ownerChange: forward });
            }
            else if (item.TaskItemAction == EnumTaskItemAction.Forward) {
                var forward = {
                    text: Resources.Task.ForwardTaskTo + " " + item.NewOwnerName,
                    target: getNewOwner(),
                    iconClass: 'icon-arrow-right'
                };
                newItem = __assign({}, viewItem, { ownerChange: forward });
            }
            else if (item.TaskItemAction == EnumTaskItemAction.Returned) {
                var forward = {
                    text: Resources.Task.ReturnedTaskTo + " " + item.NewOwnerName,
                    target: getNewOwner(),
                    iconClass: 'icon-arrow-right'
                    //iconClass: 'icon-reply'
                };
                newItem = __assign({}, viewItem, { ownerChange: forward });
            }
            return newItem;
        };
        for (var i = 0; i < taskItems.length; i++) {
            var item = taskItems[i];
            var sameRequest = true;
            //Build new request
            if (i == 0 || item.RequestTypeID) {
                var requestTypeSequence = getRequestSequence(item.RequestTypeID);
                var requestTypeDisplayName = (item.RequestType.Acronym && item.RequestType.Acronym != '')
                    ? ('[' + item.RequestType.Acronym + '-' + requestTypeSequence + '] ' + item.RequestType.Name)
                    : ('[' + requestTypeSequence + '] ' + item.RequestType.Name);
                var requestIndex = ret.length;
                currentRequest = {
                    requestTypeID: item.RequestTypeID,
                    sequence: requestTypeSequence,
                    display: requestTypeDisplayName,
                    color: item.RequestType.ColorID,
                    index: requestIndex,
                    firstTaskItemID: item.TaskItemID,
                    state: expandedRequests[requestIndex] ? TaskDetailRequestState.Open : TaskDetailRequestState.Closed,
                    colapsedItems: 0,
                    items: []
                };
                ret.push(currentRequest);
                sameRequest = false;
            }
            var getNewOwner = function () { return ({ UserID: item.NewOwnerUserID, UserLogin: item.NewOwnerName, UserHashCode: item.NewOwnerHashCode }); };
            var getOldOwner = function () { return ({
                UserID: item.OldOwnerUserID,
                UserLogin: item.OldOwnerName,
                UserHashCode: item.OldOwnerHashCode
            }); };
            var headless = (sameRequest && previousFromUserID == item.OldOwnerUserID && previousDate && $M(item.Date).diff(previousDate, 'm') < 2);
            var viewItem = {
                alwaysVisible: true,
                user: getOldOwner(),
                date: $M(item.Date),
                newItemsStamp: false,
                taskItemID: item.TaskItemID,
                headless: headless,
                attachments: item.Attachments || [],
                system: false,
                reopen: null,
                ownerChange: null,
                common: null,
                action: null,
                pipelineStepChange: null,
                subtask: null,
                close: null,
                extranet: null,
                artificial: item.TaskItemTypeID == EnumTaskItemType.Common
            };
            //Reopen
            if (item.PreviousClosedState && item.Closed === false) {
                var reopen = {
                    text: "" + Resources.Task.ReopenedTask,
                    target: getNewOwner(),
                    iconClass: 'icon-arrow-right'
                };
                currentRequest.items.push(__assign({}, viewItem, { reopen: reopen }));
            }
            ////Owner change
            if (item.TaskItemTypeID != EnumTaskItemType.Common && item.NewOwnerUserID && previousNewUserID != item.NewOwnerUserID) {
                newItem = buildOwnerChangeItem(item, viewItem);
                currentRequest.items.push(__assign({}, viewItem, newItem));
                previousNewUserID = item.NewOwnerUserID;
            }
            //Common
            if (item.TaskItemTypeID == EnumTaskItemType.Common) {
                var common = {
                    comment: item.TaskItemComment,
                    noCollapsable: !!expandedTaskItems[item.TaskItemID],
                    highlighted: false,
                    actions: {
                        canEdit: false,
                        canAmmend: false,
                        canHighlight: false,
                        canRemoveHighlight: false,
                        canReplicate: item.TaskItemTypeID == EnumTaskItemType.Common && !taskData.ParentTaskID && taskData.ActualPermissions.CreateSubtasks,
                        none: false
                    }
                };
                common.actions.none = _(common.actions).values().filter(function (x) { return x; }).length == 0;
                var newItemsStamp = !newItemsStamped && viewItem.date.diff(lastReadDate, 's') > 0;
                newItemsStamped = newItemsStamped || newItemsStamp;
                var newItem = {};
                //Owner change
                if (item.NewOwnerUserID && previousNewUserID != item.NewOwnerUserID) {
                    newItem = __assign({}, buildOwnerChangeItem(item, viewItem), { headless: false });
                    previousNewUserID = item.NewOwnerUserID;
                }
                newItem = __assign({}, viewItem, newItem, { artificial: false, newItemsStamp: (ret.length > 1 || currentRequest.items.length > 0) ? newItemsStamp : false, common: common });
                currentRequest.items.push(newItem);
                previousFromUserID = item.OldOwnerUserID;
                previousDate = viewItem.date.clone();
            }
            else {
                previousFromUserID = undefined;
            }
            var action;
            //Actions
            if (item.DiffDueDate) {
                action = {
                    text: Resources.Task.UpdateDueDateTo + "  " + $M(item.DueDate, true).toShortString()
                };
                currentRequest.items.push(__assign({}, viewItem, { action: action }));
            }
            if (item.EffortEstimation) {
                action = {
                    text: Resources.Task.UpdatedEffortEstimationTo + ' ' + Utils.MinuteToDays(item.EffortEstimation, true)
                };
                currentRequest.items.push(__assign({}, viewItem, { action: action }));
            }
            if (item.RemainingEffortEstimation) {
                action = {
                    text: Resources.Task.UpdatedEffortEstimationTo + ' ' + Utils.MinuteToDays(item.RemainingEffortEstimation, true)
                };
                currentRequest.items.push(__assign({}, viewItem, { action: action }));
            }
            if (item.TaskItemTypeID == EnumTaskItemType.CreateChildTask && item.Subtask) {
                var subtask = {
                    text: "" + Resources.Task.CreatedSubTask.replace('{0}', item.Subtask.TaskTitle),
                    url: item.Subtask ?
                        URLs.BuildUrl(_.extend({ 'Type': 'task', 'ClientNickName': jobData.Client.ClientNickName, 'JobNumber': jobData.JobNumber, 'TaskNumber': item.Subtask.TaskNumber }, options.aditionalTaskUrlParams), options.taskUrlType) :
                        ''
                };
                currentRequest.items.push(__assign({}, viewItem, { subtask: subtask }));
            }
            else if (item.TaskItemTypeID == EnumTaskItemType.CreateChildTask) {
                var text = $("<p>" + item.TaskItemComment + "</p>").text();
                var subtask = {
                    text: "" + text,
                    url: ''
                };
                currentRequest.items.push(__assign({}, viewItem, { subtask: subtask }));
            }
            if (item.TaskItemTypeID == EnumTaskItemType.CloseChildTask && item.Subtask) {
                var subtask = {
                    text: item.Subtask.Closed ?
                        "" + Resources.Task.ClosedSubTask.replace('{0}', item.Subtask.TaskTitle) :
                        "" + Resources.Task.ReopenedSubTask.replace('{0}', item.Subtask.TaskTitle),
                    url: URLs.BuildUrl(_.extend({ 'Type': 'task', 'ClientNickName': jobData.Client.ClientNickName, 'JobNumber': jobData.JobNumber, 'TaskNumber': item.Subtask.TaskNumber }, options.aditionalTaskUrlParams), options.taskUrlType)
                };
                currentRequest.items.push(__assign({}, viewItem, { subtask: subtask }));
            }
            else if (item.TaskItemTypeID == EnumTaskItemType.CloseChildTask) {
                var text = $("<p>" + item.TaskItemComment + "</p>").text();
                var subtask = {
                    text: "" + text,
                    url: ''
                };
                currentRequest.items.push(__assign({}, viewItem, { subtask: subtask }));
            }
            if (item.TaskItemTypeID == EnumTaskItemType.ExternalRequest) {
                var extranet = {
                    text: item.TaskItemComment
                };
                currentRequest.items.push(__assign({}, viewItem, { extranet: extranet }));
            }
            if (item.PipelineStepID) {
                var pipelineStepChange = {
                    text: "" + Resources.Task.ChangedPipelineStepTo,
                    pipelineStepTitle: getPipelineStepTitle(item.PipelineStepID)
                };
                currentRequest.items.push(__assign({}, viewItem, { pipelineStepChange: pipelineStepChange }));
            }
            if (item.Closed === true) {
                var close = {
                    text: "" + Resources.Task.ClosedTask,
                    target: getNewOwner(),
                    iconClass: 'iicon-arrow-right'
                };
                currentRequest.items.push(__assign({}, viewItem, { close: close }));
            }
        }
        ret.forEach(function (req, index) {
            if (req.state == TaskDetailRequestState.Open)
                return;
            if (req.items[0].date.diff(lastReadDate, 's') > 0) {
                req.state = TaskDetailRequestState.Open;
            }
            else if (index == ret.length - 1) {
                if (req.items.length > maxVisibleItemsOnPartialRequests) {
                    req.state = TaskDetailRequestState.Partial;
                    setupPartialRequest(req);
                }
                else {
                    req.state = TaskDetailRequestState.Open;
                }
            }
            else {
                if (req.items[req.items.length - 1].date.diff(lastReadDate, 's') < 0) {
                    req.state = TaskDetailRequestState.Closed;
                }
                else {
                    req.state = TaskDetailRequestState.Partial;
                    setupPartialRequest(req);
                }
            }
        });
        return ret;
    };
    TaskViewModel.prototype.refreshTaskAttachments = function (data) {
        this.TaskAttachments(_.filter(data, function (attachment) { return attachment.AttachmentTypeID != TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
        this.TaskImages(_.filter(data, function (attachment) { return attachment.AttachmentTypeID == TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
    };
    TaskViewModel.prototype.refreshExternalAttachments = function (data) {
        this.ExternalAttachments(_.filter(data, function (attachment) { return attachment.AttachmentTypeID != TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
        this.ExternalImages(_.filter(data, function (attachment) { return attachment.AttachmentTypeID == TaskDetailViewModel.TASK_ATTACHMENT_TYPE_IMAGE; }));
    };
    return TaskViewModel;
}());
var NewTaskItem = /** @class */ (function () {
    function NewTaskItem(taskData) {
        this.NewOwner = ko.observable({});
        this.Comment = ko.observable("");
        this.PostAction = ko.observable(NewPostAction.None);
        this.RequestTypeID = ko.observable(0);
        this.InvalidRequestType = ko.observable(false);
        this.CreateSubtaskInvalidRequestType = ko.observable(false);
        this.ExistingTaskAttachments = ko.observableArray([]);
        this.ExistingAttachments = ko.observableArray([]);
        this.FullPost = ko.observable(false);
        this.RequestTypeComputed = ko.computed(function () {
            return this.RequestTypeID();
        }, this).extend({ throttle: 500 });
        this.RequestTypeComputed.subscribe(function (requestTypeID) {
            $("select#taskDetailRequestTypeList").trigger('task:changeRequestType', [requestTypeID]);
            if (requestTypeID > 0 && !this.MultipleOwners())
                $("select#taskDetailRequestTypeList").trigger('task:applytemplate', [requestTypeID]);
        }, this);
        this.PipelineStepID = ko.observable(null);
        this.PipelineStepRestarted = ko.observable(false);
        this.TaskItemTemplateID = ko.observable(null);
        this.NotifyEveryMember = ko.observable(false);
        this.NotificationUsers = ko.observableArray([]);
        this.PostAction.subscribe(function (action) {
            if (action != NewPostAction.ChildTask && self.CurrentSubtask() != null)
                self.CurrentSubtask(null);
            if (action == NewPostAction.Forward) {
                if (self.NewDueDate() == null || $M(self.NewDueDate(), true).diffDays($M(null, true)) < 0) {
                    self.NewDueDate(null);
                }
            }
        });
        this.TaskData = taskData;
        this.CurrentSubtask = ko.observable(null);
        var self = this;
        this.ActualOwner = ko.computed(function () {
            if (self.PostAction() == NewPostAction.None || self.PostAction() == NewPostAction.Comment || this.PostAction() == NewPostAction.CloseChildTask)
                return self.TaskData().Owner;
            if (this.PostAction() == NewPostAction.Answer)
                return self.TaskData().LastForwardUser;
            if (this.PostAction() == NewPostAction.Forward || this.PostAction() == NewPostAction.ChildTask)
                return self.NewOwner();
        }, this);
        this.NewPostDescription = ko.computed(function () {
            if (this.PostAction() == NewPostAction.Answer)
                return Resources.Task.Replying;
            else if (this.PostAction() == NewPostAction.Forward)
                return Resources.Task.Forwarding;
            else if (this.PostAction() == NewPostAction.Comment)
                return Resources.Task.Commenting;
            else if (this.PostAction() == NewPostAction.ChildTask)
                return Resources.Task.Subtask.toUpperCase() + ': ' + self.CurrentSubtask().Title;
            else if (this.PostAction() == NewPostAction.CloseChildTask)
                return Resources.Task.Finishing.toUpperCase();
            return '';
        }, this);
        this.NewDueDate = ko.observable(null);
        this.setDueDate(taskData().DueDate);
        this.DueDateText = ko.computed(function () {
            //return (self.NewDueDate()) ? $M(self.NewDueDate(), true).format(environmentData.RegionalSettings.MomentShortDateFormat) : '';
            var taskduedate = '';
            if (this.NewDueDate() != null && this.NewDueDate() != '')
                taskduedate = $M(this.NewDueDate(), true).format('YYYY-MM-DDT00:00:00');
            return taskduedate;
        }, this);
        this.ForceLoadAllocation = ko.observable(false);
        this.ShowDueDateSelector = ko.computed(function () {
            if (self.ForceLoadAllocation())
                return true;
            if (self.ActualOwner() && self.ActualOwner().UserID > 0 && self.PostAction() == NewPostAction.Forward) {
                return true;
            }
            return false;
        });
        this.AllocationDueDateText = ko.computed(function () {
            return (self.NewDueDate()) ? $M(self.NewDueDate(), true).format(environmentData.RegionalSettings.MomentShortestDateFormat) : Resources.Commons.Select;
        });
        this.ConnectionID = ko.computed(function () {
            return SignalrHub.MainHub.connection.id;
        }, this);
        this.MultipleOwners = ko.observable(false);
        this.SubtasksOwnerList = ko.observableArray([]);
        this.SubtasksCopyTaskAttachments = ko.observableArray([]);
        this.HidePostControls = ko.observable(false);
    }
    NewTaskItem.prototype.CreateChildTask = function (subtask, multipleOwners) {
        this.CurrentSubtask(subtask);
        this.MultipleOwners(multipleOwners);
        this.PostAction(NewPostAction.ChildTask);
    };
    NewTaskItem.prototype.setDueDate = function (date) {
        var self = this;
        //obriga nova seleção de data apenas se for o criador da tarefa, tenha permissão de trocar o prazo e tarefa esteja atrasada
        var permissions = self.TaskData().ActualPermissions;
        if (self.PostAction() == NewPostAction.Forward && permissions.ChangeDueDate && self.TaskData().CreationUserID == environmentData.currentUserID && (date == null || $M(date, true).diffDays($M(null, true)) < 0)) {
            self.NewDueDate(null);
            return false;
        }
        self.NewDueDate(date);
    };
    NewTaskItem.prototype.clearDueDate = function () {
        this.NewDueDate(null);
    };
    NewTaskItem.prototype.addUserToBeNotified = function (userID, userHashCode, userLogin) {
        if (_.any(this.NotificationUsers(), function (u) { return u.UserID == userID; }))
            return;
        var newItem = { UserID: userID, UserHashCode: userHashCode, UserLogin: userLogin };
        this.NotificationUsers.push(newItem);
    };
    NewTaskItem.prototype.removeUserToBeNotified = function (userID) {
        var item = _.where(this.NotificationUsers(), { UserID: +userID })[0];
        if (item)
            this.NotificationUsers.remove(item);
    };
    NewTaskItem.prototype.DeleteExistingTaskAttachment = function (index) {
        var attachments = this.ExistingTaskAttachments();
        attachments.splice(index, 1);
        this.ExistingTaskAttachments(attachments);
    };
    NewTaskItem.prototype.DeleteExistingAttachment = function (attachment) {
        this.ExistingAttachments.remove(attachment);
    };
    NewTaskItem.prototype.addSubtaskOwner = function (user, subtask) {
        var taskNumber = 0;
        var taskTitle = this.TaskData()['TaskTitle'];
        var effortEstimation = null;
        var effortUnitListString = null;
        if (subtask) {
            taskNumber = subtask.TaskNumber;
            taskTitle = subtask.TaskTitle;
            effortEstimation = subtask.EffortEstimation;
            effortUnitListString = subtask.EffortUnitListString;
        }
        var newItem = {
            UserID: user.UserID,
            UserHashCode: user.UserHashCode,
            UserLogin: user.UserLogin,
            OriginalTaskNumber: taskNumber,
            TaskNumber: ko.observable(taskNumber),
            TaskTitle: ko.observable(taskTitle),
            EffortEstimation: ko.observable(effortEstimation),
            EffortUnitListString: ko.observable(effortUnitListString)
        };
        this.SubtasksOwnerList.push(newItem);
        var $queueNumber = $('#multiple-subtask-user' + user.UserID).find('span.number');
        if (subtask != null) {
            $queueNumber.html(subtask.AbsoluteUserOrder);
            return;
        }
        $.get('Task/GetUserNewTaskOrder', { ownerUserID: user.UserID, dueDate: $M(this.TaskData()['DueDate']).toLocaleJSON() }, function (data) {
            if ($queueNumber.length > 0) {
                if (data.Success === false)
                    $queueNumber.html('?');
                else
                    $queueNumber.html(data.NewTaskAbsoluteUserOrder);
            }
        });
    };
    NewTaskItem.prototype.removeSubtaskOwner = function (userID) {
        var item = _.where(this.SubtasksOwnerList(), { UserID: +userID })[0];
        if (item)
            this.SubtasksOwnerList.remove(item);
    };
    NewTaskItem.prototype.reset = function () {
        this.NewOwner({});
        this.Comment("");
        this.NotificationUsers([]);
        this.PostAction(NewPostAction.None);
        this.PipelineStepID(null);
        this.TaskItemTemplateID(null);
        this.NotifyEveryMember(false);
        this.SubtasksOwnerList([]);
        this.SubtasksCopyTaskAttachments([]);
        this.MultipleOwners(false);
        this.HidePostControls(false);
        this.RequestTypeID(null);
        this.InvalidRequestType(false);
        this.CreateSubtaskInvalidRequestType(false);
        this.ExistingTaskAttachments([]);
        this.ExistingAttachments([]);
        this.PipelineStepRestarted(false);
    };
    return NewTaskItem;
}());
var DeliverableDetailsViewModel = /** @class */ (function () {
    function DeliverableDetailsViewModel() {
        this.DeliverableID = ko.observable(0);
        this.DeliverableName = ko.observable('');
        this.OpenTasks = ko.observableArray([]);
        this.ClosedTasks = ko.observableArray([]);
        this.Loaded = ko.observable(false);
    }
    DeliverableDetailsViewModel.prototype.RefreshData = function (data) {
        if (!data)
            return;
        this.DeliverableID(data.DeliverableID);
        this.DeliverableName(data.Name);
        this.OpenTasks(data.OpenTasks);
        this.ClosedTasks(data.ClosedTasks);
    };
    return DeliverableDetailsViewModel;
}());
var DueDateOrderViewModel = /** @class */ (function () {
    function DueDateOrderViewModel() {
        this.Tasks = ko.observableArray([]);
    }
    DueDateOrderViewModel.prototype.MoveUp = function (index) {
        if (index <= 0)
            return;
        var newIndex = (index - 1);
        var tasks = this.Tasks();
        this.Tasks(Utils.ArrayMove(tasks, index, newIndex));
    };
    DueDateOrderViewModel.prototype.MoveDown = function (index) {
        if (index >= this.Tasks().length)
            return;
        var newIndex = (index + 1);
        var tasks = this.Tasks();
        this.Tasks(Utils.ArrayMove(tasks, index, newIndex));
    };
    return DueDateOrderViewModel;
}());
var DueDateViewModel = /** @class */ (function () {
    function DueDateViewModel() {
        var self = this;
        this.OwnerUser = ko.observable({});
        this.NewDueDate = ko.observable(null);
        this.Interval = ko.observable(null);
        this.HasSubtasks = ko.observable(false);
        this.NewDueDateShortText = ko.computed(function () {
            var text = Resources.Commons.Select;
            var newDueDate = self.NewDueDate();
            var interval = self.Interval();
            if (newDueDate)
                text = $M(newDueDate, true).format(environmentData.RegionalSettings.MomentShortestDateFormat);
            else if (interval == AllocationIntervalDays.TenDays)
                text = Resources.Task.TenDays;
            else if (interval == AllocationIntervalDays.TwentyDays)
                text = Resources.Task.TwentyDays;
            return text;
        });
        this.NewDueDateText = ko.computed(function () {
            var text = Resources.Commons.Select;
            var newDueDate = self.NewDueDate();
            var interval = self.Interval();
            if (newDueDate)
                text = $M(newDueDate, true).format(environmentData.RegionalSettings.MomentShortDateFormat);
            else if (interval == AllocationIntervalDays.TenDays)
                text = Resources.Task.TenDays;
            else if (interval == AllocationIntervalDays.TwentyDays)
                text = Resources.Task.TwentyDays;
            return text;
        });
    }
    return DueDateViewModel;
}());
var EditEffortEstimationViewModel = /** @class */ (function () {
    function EditEffortEstimationViewModel() {
        var self = this;
        this.EffortEstimation = ko.observable(null);
        this.SelectedEffortEstimationType = ko.observable(EnumTimepickerMode.Hours);
        this.SelectedEffortEstimationText = ko.computed(function () {
            if (self.SelectedEffortEstimationType() == EnumTimepickerMode.Hours)
                return Resources.Commons.Hours;
            else if (self.SelectedEffortEstimationType() == EnumTimepickerMode.Days)
                return Resources.Commons.Days;
            else if (self.SelectedEffortEstimationType() == null)
                return Resources.Task.EffortUnit;
            return '';
        });
        this.EffortUnit = ko.observableArray([]);
        this.EffortUnit.subscribe(function (list) {
            if (list.length > 3) {
                $('#taskHeaderUpdate #effortUnitTableContainer').jsScroll();
            }
        });
        this.EffortUnitListString = ko.observable('');
    }
    return EditEffortEstimationViewModel;
}());
var SubtaskViewModel = /** @class */ (function () {
    function SubtaskViewModel(taskID) {
        this.TaskID = ko.observable(taskID);
        this.SubtaskID = ko.observable(0);
        this.Title = ko.observable('');
        this.Done = ko.observable(false);
        this.ChildTaskID = ko.observable(null);
        this.ChildTask = ko.observable(null);
        this.UpdateStatus = ko.observable(null);
        this.RealTitle = ko.observable('');
        this.DisplayTitle = ko.computed(function () {
            if (this.ChildTask() && this.ChildTask().Owner)
                return '[' + this.ChildTask().Owner.UserLogin + '] ' + this.Title();
            return this.Title();
        }, this);
    }
    SubtaskViewModel.prototype.refreshData = function (data) {
        this.TaskID(data.TaskID);
        this.SubtaskID(data.SubtaskID);
        this.Title(data.Title);
        this.Done(data.Done);
        this.ChildTaskID(data.ChildTaskID);
        this.ChildTask(data.ChildTask);
        this.RealTitle('');
    };
    return SubtaskViewModel;
}());
var NewExternalTaskItemViewModel = /** @class */ (function () {
    function NewExternalTaskItemViewModel() {
        this.TaskNumber = ko.observable(0);
        this.Comment = ko.observable('');
        this.RequireApproval = ko.observable(false);
        this.ToClientContact = ko.observable(null);
        this.MemberContacts = ko.observableArray([]);
        this.NotifyContacts = ko.observableArray([]);
        this.Attachments = ko.observableArray([]);
        this.InternalTaskAttachments = ko.observableArray([]);
        this.ConnectionID = ko.computed(function () {
            return SignalrHub.MainHub.connection.id;
        }, this);
        this.ToClientContactID = ko.computed(function () {
            var toContact = this.ToClientContact();
            if (toContact && _.any(this.NotifyContacts(), function (x) { return x.ClientContactID == toContact.ClientContactID; }))
                return toContact.ClientContactID;
            var contacts = this.NotifyContacts();
            var contact = _(contacts).first();
            if (contact)
                return contact.ClientContactID;
            return null;
        }, this);
        this.ExtranetPipelineStepID = ko.observable(null);
    }
    NewExternalTaskItemViewModel.prototype.RemoveNotifyContact = function (contact) {
        if (this.NotifyContacts().length > 1)
            this.NotifyContacts.remove(contact);
    };
    NewExternalTaskItemViewModel.prototype.DeleteInternalAttachment = function (index) {
        var attachments = this.InternalTaskAttachments();
        attachments.splice(index, 1);
        this.InternalTaskAttachments(attachments);
    };
    NewExternalTaskItemViewModel.prototype.AddAttachment = function (data) {
        var attachment = new AttachmentViewModel();
        attachment.refreshData(data);
        this.Attachments.push(attachment);
    };
    NewExternalTaskItemViewModel.prototype.RemoveAttachment = function (guid) {
        var index = _.indexOf(_.pluck(ko.toJS(this.Attachments()), 'Identification'), guid);
        this.Attachments.remove(this.Attachments()[index]);
    };
    NewExternalTaskItemViewModel.prototype.DeleteAttachment = function (index, element) {
        var guid = this.Attachments()[index].Identification();
        $(this).trigger('taskrow:delete', guid, element);
    };
    NewExternalTaskItemViewModel.prototype.RenameAttachment = function (index, element) {
        var guid = this.Attachments()[index].Identification();
        $(this).trigger('taskrow:rename', guid, element);
    };
    NewExternalTaskItemViewModel.prototype.Reset = function () {
        this.Comment('');
        this.RequireApproval(false);
        this.Attachments([]);
        this.InternalTaskAttachments([]);
        this.MemberContacts([]);
        this.NotifyContacts([]);
        this.ToClientContact(null);
        this.ExtranetPipelineStepID(null);
        if ($('#newExternalTaskItemComment').length > 0)
            $('#newExternalTaskItemComment')[0].innerHTML = '';
    };
    return NewExternalTaskItemViewModel;
}());
var ShareAttachmentViewModel = /** @class */ (function () {
    function ShareAttachmentViewModel(extranet) {
        this.SelectedAttachmentsIDs = ko.observableArray([]);
        this.AllAttachments = ko.observableArray([]);
        this.AllImages = ko.observableArray([]);
        this.Users = ko.observableArray([]);
        this.Tasks = ko.observableArray([]);
        this.SelectedTaskID = ko.observable(0);
        this.SelectedAttachmentType = ko.observable(null);
        this.Extranet = ko.observable(extranet || false);
        this.SetupComputeds();
    }
    ShareAttachmentViewModel.prototype.RefreshData = function (files, images, tasks) {
        var _this = this;
        this.AllAttachments(files);
        this.AllImages(images);
        taskrow.ListUsers(function (users) { return _this.RefreshFiltersObservables(users, tasks); });
    };
    ShareAttachmentViewModel.prototype.RefreshFiltersObservables = function (allUsers, taskWithAttachments) {
        var userIDs = _(this.AllAttachments().map(function (a) { return a.CreationUserID; }).concat(this.AllImages().map(function (i) { return i.CreationUserID; })).sort()).uniq(true);
        var currentUsers = _(this.Users()).filter(function (u) { return _(userIDs).indexOf(u.Value().UserID, true) >= 0; });
        var allUsersDict = _(allUsers).chain().map(function (x) { return [x.UserID, x]; }).object().value();
        var usersToBeIncluded = _(userIDs).filter(function (u) { return !_(currentUsers).any(function (x) { return x.Value() == u; }); }).map(function (x) { var dictItem = allUsersDict[x]; return new DataItem(dictItem.UserLogin, dictItem, false); });
        currentUsers = currentUsers.concat(usersToBeIncluded);
        this.Users(currentUsers.sort(function (a, b) { return a.Text().localeCompare(b.Text(), 'pt-BR', { sensitivity: 'base' }); }));
        var tasks = _.chain(taskWithAttachments)
            .sortBy(function (x) { return x.ParentTaskID > 0 ? 1 : 0; })
            .sortBy(function (x) { return x.TaskTitle; })
            .map(function (x) {
            var item = new DataItem([x.Owner.UserLogin.toLowerCase(), x.TaskTitle.toUpperCase()].join(': '), x.TaskID, x.TaskID == this.SelectedTaskID);
            item['IsParentTask'] = !x.ParentTaskID;
            return item;
        })
            .value();
        this.Tasks(tasks);
    };
    ShareAttachmentViewModel.prototype.SetupComputeds = function () {
        this.FilteredAttachments = ko.computed(function () {
            var _this = this;
            if (this.AllAttachments().length == 0)
                return [];
            var selectedUsers = _(this.Users()).filter(function (x) { return x.Selected(); }).map(function (x) { return [x.Value().UserID, true]; });
            selectedUsers.push(['length', selectedUsers.length]);
            var selectedUsersDict = _(selectedUsers).object();
            var self = this;
            var attachments = _(this.AllAttachments())
                .chain()
                .filter(function (x) { return (!_this.SelectedTaskID() || x.TaskID == _this.SelectedTaskID()) && (selectedUsersDict.length == 0 || selectedUsersDict[x.CreationUserID]) && (!_this.SelectedAttachmentType() || x.AttachmentTypeID == _this.SelectedAttachmentType()); })
                .groupBy(function (x) { return $M(x.CreationDate).toShortString(); })
                .pairs()
                .map(function (x) {
                var attachmentList = _.chain(x[1])
                    .map(function (attachment) {
                    var attachmentID = self.Extranet() ? attachment.AttachmentID : attachment.TaskAttachmentID;
                    var item = _.extend(attachment, { ID: attachmentID, Selected: ko.observable(_.any(self.SelectedAttachmentsIDs(), function (id) { return id == attachmentID; })) });
                    item.Selected.subscribe(function (selected) {
                        if (selected)
                            self.SelectedAttachmentsIDs.push(this.ID);
                        else
                            self.SelectedAttachmentsIDs.remove(this.ID);
                    }, item);
                    return item;
                })
                    .sortBy(function (d) { return -$M(d.CreationDate).toDate().getTime(); })
                    .value();
                return {
                    CreateDate: x[0],
                    Attachments: attachmentList
                };
            })
                .sortBy(function (x) { return -$M(x.Attachments[0].CreationDate).toDate().getTime(); })
                .value();
            return attachments;
        }, this);
        this.FilteredImages = ko.computed(function () {
            var _this = this;
            if (this.AllImages().length == 0)
                return [];
            var selectedUsers = _(this.Users()).filter(function (x) { return x.Selected(); }).map(function (x) { return [x.Value().UserID, true]; });
            selectedUsers.push(['length', selectedUsers.length]);
            var selectedUsersDict = _(selectedUsers).object();
            var self = this;
            var images = _(this.AllImages())
                .chain()
                .filter(function (x) { return (!_this.SelectedTaskID() || x.TaskID == _this.SelectedTaskID()) && (selectedUsersDict.length == 0 || selectedUsersDict[x.CreationUserID]) && (!_this.SelectedAttachmentType() || x.AttachmentTypeID == _this.SelectedAttachmentType()); })
                .groupBy(function (x) { return $M(x.CreationDate).toShortString(); })
                .pairs()
                .map(function (x) {
                var imageList = _.chain(x[1])
                    .map(function (image) {
                    var attachmentID = self.Extranet() ? image.AttachmentID : image.TaskAttachmentID;
                    var item = _.extend(image, { ID: attachmentID, Selected: ko.observable(_.any(self.SelectedAttachmentsIDs(), function (id) { return id == attachmentID; })) });
                    item.Selected.subscribe(function (selected) {
                        if (selected)
                            self.SelectedAttachmentsIDs.push(this.ID);
                        else
                            self.SelectedAttachmentsIDs.remove(this.ID);
                    }, item);
                    return item;
                })
                    .sortBy(function (d) { return -$M(d.CreationDate).toDate().getTime(); })
                    .value();
                return {
                    CreateDate: x[0],
                    Attachments: imageList
                };
            })
                .sortBy(function (x) { return -$M(x.Attachments[0].CreationDate).toDate().getTime(); })
                .value();
            return images;
        }, this);
        this.SelectedTaskTitle = ko.computed(function () {
            var _this = this;
            if (!this.SelectedTaskID())
                return Resources.Task.ViewAllTasks;
            return _(this.Tasks()).find(function (x) { return x.Value() == _this.SelectedTaskID(); }).Text();
        }, this);
        this.SelectedAttachmentTypeText = ko.computed(function () {
            if (this.SelectedAttachmentType() == EnumTaskAttachmentType.LocalItemTypeID)
                return Resources.TaskAttachment.Files;
            if (this.SelectedAttachmentType() == EnumTaskAttachmentType.LocalImageTypeID)
                return Resources.TaskAttachment.Images;
            return Resources.TaskAttachment.AttachmentType;
        }, this);
    };
    return ShareAttachmentViewModel;
}());
var TaskDetailRequestState;
(function (TaskDetailRequestState) {
    TaskDetailRequestState[TaskDetailRequestState["Open"] = 1] = "Open";
    TaskDetailRequestState[TaskDetailRequestState["Closed"] = 2] = "Closed";
    TaskDetailRequestState[TaskDetailRequestState["Partial"] = 3] = "Partial";
})(TaskDetailRequestState || (TaskDetailRequestState = {}));
define(function () {
    return TaskDetail;
});
//# sourceMappingURL=TaskDetail.js.map