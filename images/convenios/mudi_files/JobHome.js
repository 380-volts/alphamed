///<reference path="../../Main/App.ts"/>
///<reference path="../Task/TaskDetail.ts"/>
///<reference path="JobDetail.ts"/>
var EnumJobHomeViewMode;
(function (EnumJobHomeViewMode) {
    EnumJobHomeViewMode[EnumJobHomeViewMode["Tasklist"] = 1] = "Tasklist";
    EnumJobHomeViewMode[EnumJobHomeViewMode["Calendar"] = 3] = "Calendar";
})(EnumJobHomeViewMode || (EnumJobHomeViewMode = {}));
var JobHome = /** @class */ (function () {
    function JobHome() {
        this.jobHome = true;
        this.initialized = false;
        this.taskOpen = false;
        this.avoidCache = false;
        this.editJob = false;
        this.pendingImageVerifierInterval = 0;
        this.closeJobModal = null;
        this.currentContainer = '';
    }
    JobHome.prototype.CurrentSection = function () {
        return Section.Job;
    };
    JobHome.prototype.CurrentContext = function () {
        return this._currentContext;
    };
    JobHome.prototype.HasOwnMenu = function () {
        return true;
    };
    JobHome.prototype.Setup = function (options) {
    };
    JobHome.prototype.Action = function (options) {
        var self = this;
        var sideAction = $.noop;
        if (options.editJob) {
            sideAction = function () {
                self.CloseDashboardTask();
                self.CloseDashboardDeliverable();
                self.EditJob();
            };
        }
        else if (options.newDeliverable) {
            sideAction = function () { self.NewDeliverable(); };
        }
        else if (options.openDeliverable) {
            sideAction = function () { self.OpenDeliverable(options.deliverableID); };
        }
        else if (options.showDeliverables) {
            sideAction = function () { self.ShowDeliverables(); };
        }
        else if (options.CloseCurrentContext) {
            sideAction = function () {
                self.CloseDashboardJob();
                self.CloseDashboardDeliverable();
                self.CloseDashboardContent();
            };
        }
        else if (options.TaskInfo) {
            sideAction = function () {
                self.LoadTask(options.TaskInfo);
            };
        }
        if (self.initialized)
            sideAction();
        else
            self.LoadJobHome(options, sideAction);
        self.initialized = true;
    };
    JobHome.prototype.Unload = function () {
        if (this.searchBox)
            this.searchBox.Unload();
        if (this.currentJob)
            this.currentJob.Unload();
        Utils.CleanNode($('#dashboard')[0]);
        $(window).unbind('resize', this.SetupListScroll);
        if (this.wallPost)
            this.wallPost.Unload();
        if (this.notes != null)
            this.notes.Destroy();
        if (this.attachments)
            this.attachments.Destroy();
        if (this.listenTaskNotifications) {
            $(window).unbind('signalr:notifyTaskChange', this.listenTaskNotifications);
            this.listenTaskNotifications = null;
        }
        if (this.serverData && this.serverData.Job)
            SignalrHub.LeaveJobChannelGroup([this.serverData.Job.JobID]);
        clearInterval(this.pendingImageVerifierInterval);
    };
    JobHome.prototype.SetupTaskNotificationListening = function () {
        var self = this;
        if (!this.listenTaskNotifications) {
            this.listenTaskNotifications = function (e, change) {
                //console.log(change);
                if (change.JobID == self.serverData.Job.JobID) {
                    self.NotifyTaskChange(change);
                }
            };
            $(window).bind('signalr:notifyTaskChange', this.listenTaskNotifications);
        }
    };
    JobHome.prototype.CloseDashboardJob = function () {
        $('.job-details').remove();
        if (this.currentJob) {
            this.currentJob.Unload();
            this.currentJob.Clear();
            this.currentJob = null;
        }
        this.editJob = false;
    };
    JobHome.prototype.CloseDashboardJobDetails = function () {
        this.CloseDashboardJob();
        this.ShowMainDashboard();
    };
    JobHome.prototype.CloseDashboardContent = function () {
        this.CloseDashboardTask();
        this.ShowMainDashboard();
    };
    JobHome.prototype.CloseDashboardTask = function () {
        $('.task-details').remove();
        if (this.currentTask) {
            this.currentTask.OnClose();
            this.currentTask = null;
        }
        this.taskOpen = false;
    };
    JobHome.prototype.ShowMainDashboard = function () {
        this.ShowTaskList();
        $('#tasklist').children('li').removeClass('active');
        this.ReloadDescMemoBox();
        location.href = URLs.BuildUrl(this.serverData.Job.UrlData);
        if (this.viewModel.CurrentViewMode() != EnumJobHomeViewMode.Calendar)
            $('#divDashBoard').show();
        else
            $('#divDashBoard').hide();
    };
    JobHome.prototype.ToggleFilter = function (filterName) {
        var self = this;
        var arr = [];
        var options = {
            duration: 200,
            complete: function () {
                self.SetupListScroll();
            },
            step: function (now, tween) {
                if (tween.prop == 'height') {
                    if (tween.end > tween.now)
                        $('#tasklist').css('margin-top', (tween.end - tween.now) + 'px');
                    else
                        $('#tasklist').css('margin-top', null);
                }
            }
        };
        $('#jobTasklist-filters .filter-' + filterName).slideToggle(options);
    };
    JobHome.prototype.CalendarScroll = function () {
        var element = $('#taskCalendar')[0];
        var thead = $('#taskCalendar thead');
        if (element.scrollTop < 1) {
            thead.css('transform', '');
            thead.removeClass('scrolling');
        }
        else {
            thead.css('transform', 'translate(0,' + (element.scrollTop - 11) + 'px)');
            thead.addClass('scrolling');
        }
    };
    JobHome.prototype.GotoKanbanView = function () {
        location.href = URLs.BuildUrl(this.serverData.Job.UrlData, 'cardview');
    };
    JobHome.prototype.SetupListScroll = function () {
        var $list = null;
        if (this.currentContainer == 'tasklistContainer') {
            $('#deliverableListContainer').hide();
            $list = $('#tasklist');
            if ($('#taskCalendar').length > 0) {
                var calendar = $('#taskCalendar');
                UI.SetupPositionFixedElementHeight($('#taskCalendar'));
                calendar.jsScroll();
                $('#taskCalendar').bind('scroll', this.CalendarScroll);
            }
        }
        else if (this.currentContainer == 'deliverableListContainer') {
            $('#tasklistContainer').hide();
            $list = $('#deliverableList');
        }
        if (!$list)
            return;
        if (!$list.attr('initializedAccordeon')) {
            $list.scrollableAccordeon();
            $list.attr('initializedAccordeon', 'true');
        }
        UI.SetupPositionFixedElementHeight($list);
        $list.jsScroll();
        $list.attr('scrollEnabled', 'true');
    };
    //SetupTasklistScroll() {
    //    UI.SetupPositionFixedElementHeight($('#tasklist'));
    //    (<any>$('#tasklist')).jsScroll();
    //    $('#tasklist').attr('scrollEnabled', 'true');
    //    (<any>$('#tasklist')).scrollableAccordeon('refresh', true);
    //    if ($('#taskCalendar').length > 0) {
    //        var calendar = <any>$('#taskCalendar');
    //        UI.SetupPositionFixedElementHeight($('#taskCalendar'));
    //        calendar.jsScroll();
    //        $('#taskCalendar').bind('scroll', this.CalendarScroll);
    //    }
    //}
    JobHome.prototype.ToggleCalendarWeekends = function () {
        if ($('#taskCalendar')[0].scrollLeft < 5) {
            var scrollLeft = $('#taskCalendar .table-wrapper').width() - $('#taskCalendar').width() + 10;
            $('#taskCalendar').animate({ 'scrollLeft': scrollLeft + 'px' });
        }
        else {
            $('#taskCalendar').animate({ 'scrollLeft': '0px' });
        }
    };
    JobHome.prototype.EnterJobChannel = function (jobID) {
        taskrow.DisplayLoading();
        setTimeout(function (self2) {
            self2.groupJoiningTimeout = setInterval(function (jobID, self) {
                if (SignalrHub.Online) {
                    try {
                        SignalrHub.JoinJobChannelGroup([jobID]);
                        clearInterval(self.groupJoiningTimeout);
                        taskrow.HideLoading();
                    }
                    catch (e) {
                    }
                }
            }, 300, jobID, self2);
        }, 300, this);
    };
    JobHome.prototype.LoadJobHome = function (options, callback) {
        var self = this;
        var mainContent = $('#main');
        var template = 'Job/JobHome', templateUrl = taskrow.templatePath + template, dataUrl = 'Job/JobHome';
        self.options = options;
        if (this.serverData && SignalrHub.Online) {
            SignalrHub.LeaveJobChannelGroup([this.serverData.Job.JobID]);
        }
        var avoidCache = self.avoidCache;
        if (avoidCache)
            self.avoidCache = false;
        $.ajax({
            url: dataUrl,
            data: { clientNickName: options.ClientNickName, jobNumber: options.JobNumber },
            //beforeSend: Utils.GetBeforeSendForCacheDisabled(avoidCache),
            //cache: !avoidCache,
            success: function (data, status) {
                if (data.Success === false) {
                    taskrow.FinishLoadModule();
                    UI.Alert(data.Message);
                    Navigation.GoBack();
                    return;
                }
                self.SetData(data);
                self.EnterJobChannel(data.Job.JobID);
                if (callback == $.noop) {
                    Activity.RegisterJob({ clientNickName: data.Job.ClientNickName, jobTitle: data.Job.JobTitle, jobNumber: data.Job.JobNumber, urlData: data.Job.UrlData });
                    Utils.ChangeJobTab(data.Job.JobNumber, data.Job.JobTitle, URLs.BuildUrl(data.Job.UrlData));
                    Activity.RegisterClient({ clientNickName: data.Job.Client.ClientNickName, displayName: data.Job.Client.DisplayName, urlData: data.Job.Client.UrlData });
                    Utils.ChangeClientTab(data.Job.Client.DisplayName, URLs.BuildUrl(data.Job.Client.UrlData));
                }
                taskrow.LoadTemplate(templateUrl, function (getHTML) {
                    taskrow.FinishLoadModule();
                    Utils.ApplyPermissions(data);
                    mainContent.html(getHTML(data));
                    ko.applyBindings(self.viewModel, $('#dashboard')[0]);
                    self.pendingImageVerifierInterval = setInterval(function (x) { return x.VerifyPendingImages(); }, 5000, self);
                    self.SetupCurrentContext();
                    self.ShowTaskList();
                    self.SetupSearchBox();
                    self.SetupListScroll();
                    self.SetupWallPost();
                    self.SetupMembersPopover();
                    self.SetupJobApprovals();
                    $(window).addListener('resize', function () {
                        self.SetupListScroll.apply(self);
                    });
                    self.ReloadDescMemoBox();
                    if (callback)
                        callback();
                    self.SetupTaskNotificationListening();
                });
            }
        });
    };
    JobHome.prototype.SetupJobApprovals = function () {
        var self = this;
        require(["Scripts/ClientViews/Job/JobApprovals"], function (ctor) {
            self.jobApprovalHelper = new ctor();
            self.jobApprovalHelper.currentJobNumber = self.serverData.Job.JobNumber;
        });
    };
    JobHome.prototype.ReloadDescMemoBox = function () {
        var memoBox = $('#divDashBoard .desc-memo');
        var memo = $('.memo', memoBox);
        if (memo.height() > memoBox.height()) {
            memoBox.css('cursor', 'pointer');
            memoBox.unbind('click').addListener('click', function (e) {
                $(this).parent().parent().removeClass('closed');
                return false;
            });
            this.viewModel.ShowMemoExpandButton(true);
        }
        else {
            memoBox.css('cursor', 'default');
            memoBox.unbind('click');
            this.viewModel.ShowMemoExpandButton(false);
        }
    };
    JobHome.prototype.ClearTaskFilters = function () {
        if (this.viewModel) {
            this.viewModel.JobTaskList.ClearFilterText();
            this.viewModel.JobTaskList.ClearTags();
            this.viewModel.JobTaskList.ClearUsers();
            this.viewModel.JobTaskList.SelectedTaskListIndex(0);
        }
    };
    JobHome.prototype.RefreshData = function (taskDonePeriod) {
        var self = this;
        var dataUrl = 'Job/JobHome';
        var avoidCache = self.avoidCache;
        var options = self.options;
        if (avoidCache)
            self.avoidCache = false;
        var data = { clientNickName: options.ClientNickName, jobNumber: options.JobNumber, taskDonePeriod: taskDonePeriod };
        taskrow.DisplayLoading();
        $.ajax({
            url: dataUrl,
            data: data,
            beforeSend: Utils.GetBeforeSendForCacheDisabled(avoidCache),
            success: function (data, status) {
                self.serverData = data;
                taskrow.HideLoading();
                self.viewModel.RefreshData(data);
                if (taskDonePeriod) {
                    self.viewModel.JobTaskList.SelectedTaskListIndex(taskDonePeriod);
                }
            }
        });
    };
    JobHome.prototype.PrepareTaskMessage = function (taskMessage) {
        taskMessage.DueDate = moment(taskMessage.DueDate).toJsonDate(true);
        taskMessage.CreationDate = moment(taskMessage.CreationDate).toJsonDate(true);
    };
    JobHome.prototype.NotifyTaskChange = function (taskData) {
        if (taskData.JobNumber != this.serverData.Job.JobNumber)
            return;
        var tasklist = this.serverData.JobTaskList;
        var task = _(tasklist.Done).findWhere({ "TaskID": taskData.TaskID });
        var taskAdded = false;
        this.PrepareTaskMessage(taskData);
        if (task) {
            var ix = tasklist.Done.indexOf(task);
            tasklist.Done.splice(ix, 1);
        }
        if (taskData.Closed) {
            taskAdded = true;
            tasklist.Done.push(taskData);
            var orderedList = [];
            var list = tasklist.Done;
            var parentTasks = _.chain(list)
                .filter(function (x) { return !x.ParentTaskID || (x.ParentTaskID > 0 && !_.any(list, function (l) { return l.TaskID == x.ParentTaskID; })); })
                .sortBy(function (x) { return x.ClosedDate; })
                .sortBy(function (x) { return x.DeliverableID; })
                .value();
            if (parentTasks.length > 0) {
                for (var i = 0; i < parentTasks.length; i++) {
                    var parentTask = parentTasks[i];
                    orderedList.push(parentTask);
                    if (!parentTask.ParentTaskID) {
                        var subtasks = _.chain(list)
                            .filter(function (x) { return x.ParentTaskID == parentTask.TaskID; })
                            .sortBy(function (x) { return x.ClosedDate; })
                            .value();
                        for (var j = 0; j < subtasks.length; j++)
                            orderedList.push(subtasks[j]);
                    }
                }
            }
            tasklist.Done = orderedList;
        }
        var deliverableChanged = false;
        task = _(tasklist.InProgress).findWhere({ "TaskID": taskData.TaskID });
        if (task) {
            deliverableChanged = (task.DeliverableID != taskData.DeliverableID);
            var ix = tasklist.InProgress.indexOf(task);
            tasklist.InProgress.splice(ix, 1);
        }
        if (!taskAdded && !taskData.Closed) {
            taskAdded = true;
            tasklist.InProgress.push(taskData);
            //caso tenha alterado entregavel de tarefa pai, atualiza o entregavel das tarefas filhas para reordenar corretamente
            if (deliverableChanged) {
                var subtasks = _.filter(tasklist.InProgress, function (x) { return x.ParentTaskID == taskData.TaskID; });
                if (subtasks && subtasks.length > 0) {
                    for (var i = 0; i < subtasks.length; i++) {
                        subtasks[i].DeliverableID = taskData.DeliverableID;
                        subtasks[i].Deliverable = taskData.Deliverable;
                    }
                }
            }
            var orderedList = [];
            var list = tasklist.InProgress;
            var parentTasks = _.chain(list)
                .filter(function (x) { return !x.ParentTaskID || (x.ParentTaskID > 0 && !_.any(list, function (l) { return l.TaskID == x.ParentTaskID; })); })
                .sortBy(function (x) { return x.DueDate; })
                .sortBy(function (x) { return x.DeliverableID; })
                .value();
            if (parentTasks.length > 0) {
                for (var i = 0; i < parentTasks.length; i++) {
                    var parentTask = parentTasks[i];
                    orderedList.push(parentTask);
                    if (!parentTask.ParentTaskID) {
                        var subtasks = _.chain(list)
                            .filter(function (x) { return x.ParentTaskID == parentTask.TaskID; })
                            .sortBy(function (x) { return x.DueDate; })
                            .value();
                        for (var j = 0; j < subtasks.length; j++)
                            orderedList.push(subtasks[j]);
                    }
                }
            }
            tasklist.InProgress = orderedList;
        }
        this.viewModel.RefreshData(this.serverData);
        this.viewModel.JobTaskList.SelectedTaskListIndex();
        this.MarkCurrentTask();
        this.ReloadCurrentTask(taskData);
    };
    JobHome.prototype.MarkCurrentTask = function (taskNumber) {
        if (!taskNumber && !this.currentTask)
            return;
        if (!taskNumber)
            taskNumber = this.currentTask.selectedTaskInfo.taskNumber;
        var activeTaskNumber = $('#tasklist').children('li.active').attr('data-tasknumber');
        if (activeTaskNumber && activeTaskNumber == taskNumber.toString())
            return;
        $('#tasklist').children('li').removeClass('active');
        var $liChildren = $('#tasklist').children('li[data-tasknumber=' + taskNumber + ']');
        if ($liChildren.length > 0) {
            $liChildren.addClass('active');
        }
        else if (this.currentTask && this.currentTask.viewModel && this.currentTask.viewModel.SelectedTask.TaskData().ParentTaskID > 0) {
            var parentTaskNumber = this.currentTask.viewModel.ParentTask.TaskNumber();
            var $liParentTask = $('#tasklist').children('li[data-tasknumber=' + parentTaskNumber + ']');
            if ($liParentTask.length > 0)
                $liParentTask.addClass('active');
        }
    };
    JobHome.prototype.ReloadCurrentTask = function (taskData) {
        if (!this.currentTask || !this.currentTask.viewModel)
            return;
        this.currentTask.ReloadTaskByNotification(taskData);
    };
    JobHome.prototype.LoadTask = function (taskInfo) {
        var self = this;
        if (self.currentTask) {
            var targetTask = self.currentTask.GetTaskOrSubtask(taskInfo.taskNumber, taskInfo.jobNumber);
            if (targetTask) {
                self.currentTask.SelectTask(targetTask);
                return;
            }
            self.currentTask.unloading = true;
        }
        self.MarkCurrentTask(taskInfo.taskNumber);
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Task/TaskDetail", 'Scripts/Plugins/DynForm', 'Scripts/Plugins/DynFormViewer'], function (ctor) {
            //caso já esteja exibindo uma tarefa chama o OnClose da mesma antes de alterar para nova task
            if (self.currentTask != null) {
                self.currentTask.OnClose();
                self.currentTask = null;
                self.taskOpen = false;
            }
            self.currentTask = new ctor();
            self.currentTask.Init(taskInfo, 'task');
            self.taskOpen = true;
            self.currentTask.Show();
        });
    };
    JobHome.prototype.SetData = function (data) {
        this.serverData = data;
        this.viewModel = new JobHomeViewModel(data);
        var self = this;
        this.viewModel.OnRefreshDataRequired = function (taskDonePeriod) {
            self.RefreshData(taskDonePeriod);
        };
    };
    JobHome.prototype.SetupMembersPopover = function () {
        var self = this;
        var members = self.viewModel.JobData().JobMember;
        var ownerUserID = self.viewModel.JobData().OwnerUserID;
        //quando possui apenas um, eh o owner e nao conta como participante
        if (members.length == 1 && members[0].UserID == ownerUserID)
            return null;
        Utils.SetupMembersPopover($('#job-members')[0], members, ownerUserID, true);
    };
    JobHome.prototype.SetupCurrentContext = function () {
        this._currentContext = Utils.GetJobContext(this.serverData.Job);
        Menu.LoadMenu(Menus.JobMenu(this.serverData));
    };
    JobHome.prototype.SetupSearchBox = function () {
        var searchBox = $('#searchBox')[0];
        this.searchBox = new ContextSearch(searchBox, this._currentContext);
        this.searchBox.Init();
    };
    JobHome.prototype.SetupWallPost = function () {
        var self = this;
        this.wallPost = new WallPost($('#job_wall')[0], self.serverData.JobWall, true);
        this.wallPost.reloadCallback = function (wallpost) {
            self.avoidCache = true;
        };
        this.wallPost.jobNumber = this.serverData.Job.JobNumber;
        this.wallPost.Init();
    };
    JobHome.prototype.VerifyPendingImages = function () {
        if (Cookies.Get('pending_images')) {
            Cookies.Set('pending_images', null);
            _($(' .text-comment img, .newTaskItemComment img, #taskImagesThumbs img, .wall-post img')).filter(function (x) { return (x.src || '').toLowerCase().indexOf('file/') >= 0; }).map(function (item) { item.src += '&n=' + (new Date()).getTime(); });
        }
    };
    //#region Job details
    JobHome.prototype.EditJob = function () {
        var self = this;
        this.ShowTaskList();
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Job/JobDetail"], function (ctor) {
            self.currentJob = new ctor();
            self.editJob = true;
            self.currentJob.Action({ jobData: self.serverData.Job });
        });
    };
    JobHome.prototype.JobApprovals = function () {
        if (this.jobApprovalHelper) {
            this.jobApprovalHelper.ShowJobApprovalsModal();
        }
    };
    JobHome.prototype.BlockJob = function () {
        var self = this;
        UI.ConfirmYesNo(Resources.Job.ConfirmBlockJob, function () {
            self.UpdateJobStatus(EnumJobStatus.Blocked);
        });
    };
    JobHome.prototype.UnblockJob = function () {
        var self = this;
        UI.ConfirmYesNo(Resources.Job.ConfirmUnblockJob, function () {
            self.UpdateJobStatus(EnumJobStatus.Open);
        });
    };
    JobHome.prototype.OpenCloseJobModal = function () {
        var self = this;
        var options = new ModalWindowOptions();
        options.title = Resources.Job.CloseJob;
        options.onClose = function (e) {
            self.closeJobModal = null;
        };
        var btnSave = new ModalButton();
        btnSave.isPrimary = true;
        btnSave.id = 'btnSaveCloseJob';
        btnSave.label = Resources.Commons.Save;
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.action = function (e, modal) {
            var closingDate = $('#closingDateBox').data('datepicker').getDate();
            if (closingDate) {
                $('#btnSaveCloseJob').button('loading');
                self.UpdateJobStatus(EnumJobStatus.Closed, $M(closingDate, true).format("YYYY-MM-DD"), function () {
                    $('#btnSaveCloseJob').button('reset');
                    self.closeJobModal.close();
                }, function () {
                    $('#btnSaveCloseJob').button('reset');
                });
            }
        };
        var btnCancel = new ModalButton();
        btnCancel.label = Resources.Commons.Cancel;
        btnCancel.action = function (e, modal) {
            modal.close();
        };
        options.buttons.push(btnSave);
        options.buttons.push(btnCancel);
        options.style = "width: 600px;";
        taskrow.DisplayLoading();
        UI.ShowModal(taskrow.templatePath + 'Job/CloseJob', {}, options, function (Modal) {
            $('#closingDateBox').datepicker({
                format: environmentData.RegionalSettings.ShortDateFormat.toLowerCase(),
                startDate: $M(null, true).add(-1, 'days').startOfDay().toDate(),
                todayBtn: true
            });
            taskrow.HideLoading();
            self.closeJobModal = Modal;
        });
    };
    JobHome.prototype.ReopenJob = function () {
        var self = this;
        UI.ConfirmYesNo(Resources.Job.ConfirmUnblockJob, function () {
            self.UpdateJobStatus(EnumJobStatus.Open);
        });
    };
    JobHome.prototype.UpdateJobStatus = function (status, closingDate, callback, failCallback) {
        var self = this;
        taskrow.DisplayLoading();
        $.ajax({
            url: 'Job/UpdateJobStatus',
            data: { clientNickName: self.serverData.Job.Client.ClientNickName, jobNumber: self.serverData.Job.JobNumber, status: status, closingDate: closingDate },
            success: function (data) {
                taskrow.HideLoading();
                if (data.Success == false) {
                    UI.Alert(data.Message);
                    if (failCallback)
                        failCallback();
                    return false;
                }
                var job = data.Entity;
                self.serverData.Job.JobStatus = job.JobStatusID;
                self.viewModel.JobStatus(job.JobStatusID);
                self.viewModel.JobData().JobStatusID = job.JobStatusID;
                self.viewModel.JobData().JobStatus = job.JobStatus;
                self.viewModel.JobData.valueHasMutated();
                if (callback && typeof callback == 'function')
                    callback();
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                taskrow.HideLoading();
                if (failCallback)
                    failCallback();
                if (console)
                    console.error(textStatus);
            }
        });
    };
    JobHome.prototype.UpdateJobPipelineStep = function (jobPipelineStepID) {
        var self = this;
        if (this.serverData.Job.JobPipelineStepID == jobPipelineStepID) {
            console.log('ignorar ação - mesmo pipeline');
            return;
        }
        taskrow.DisplayLoading();
        var failCallback = function (data) {
            taskrow.HideLoading();
            UI.Alert(data.Message);
            return false;
        };
        var successCallback = function (data) {
            if (data.Success === false)
                return failCallback(data);
            taskrow.HideLoading();
            self.serverData.Job.JobPipelineStepID = data.Entity.JobPipelineStepID;
            self.viewModel.JobData().JobPipelineStepID = data.Entity.JobPipelineStepID;
            self.viewModel.JobData.valueHasMutated();
            if (self.jobHealth != null)
                self.jobHealth.RefreshPosts();
        };
        $.post('/Job/UpdateJobPipelineStep', { clientNickName: this.serverData.Job.Client.ClientNickName, jobNumber: this.serverData.Job.JobNumber, rowVersion: this.serverData.Job.RowVersion, jobPipelineStepID: jobPipelineStepID })
            .fail(failCallback)
            .done(successCallback);
    };
    //#endregion Job Details
    //#region Tabs
    JobHome.prototype.SelectTabs = function (tab) {
        $("#tab-content-detail .tab-pane").removeClass("active");
        $("#" + tab).addClass("active");
    };
    JobHome.prototype.LoadTabWall = function (elem) {
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        this.SelectTabs("tab-wall");
    };
    JobHome.prototype.LoadTabNotes = function (elem) {
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        if (!this.notes) {
            var self = this;
            var tabNotesContent = $('#job_notes');
            var template = 'Partials/Notes', templateUrl = taskrow.templatePath + template;
            taskrow.DisplayLoading();
            require(['Scripts/Plugins/Notes'], function (ctor) {
                self.notes = new ctor();
                taskrow.LoadTemplate(templateUrl, function (getHTML) {
                    tabNotesContent.html(getHTML({}));
                    self.notes.Init("job_notes", EnumNoteType.Job, self.serverData.Job.JobID);
                    self.SelectTabs("tab-notes");
                    taskrow.HideLoading();
                });
            });
        }
        else
            this.SelectTabs("tab-notes");
    };
    JobHome.prototype.LoadTabFiles = function (elem) {
        if (!this.serverData.Permissions.ViewJobAttachments)
            return false;
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        if (!this.attachments) {
            var self = this;
            var tabFilesContent = $('#job_files');
            var template = 'Partials/Attachments', templateUrl = taskrow.templatePath + template;
            taskrow.DisplayLoading();
            require(['Scripts/Plugins/Attachments'], function (ctor) {
                self.attachments = new ctor();
                self.attachments.jobNumber = self.serverData.Job.JobNumber;
                taskrow.LoadTemplate(templateUrl, function (getHTML) {
                    tabFilesContent.html(getHTML({}));
                    self.attachments.Init(tabFilesContent[0], EnumAttachmentsMode.Job);
                    self.SelectTabs("tab-files");
                    taskrow.HideLoading();
                });
            });
        }
        else
            this.SelectTabs("tab-files");
    };
    JobHome.prototype.LoadTabAdminfo = function (elem) {
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        this.SelectTabs('tab-adminfo');
    };
    JobHome.prototype.LoadTabHealth = function (elem) {
        var self = this;
        if (!this.serverData.Permissions.Management)
            return;
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        if (!this.jobHealth) {
            var tabHealthContent = $('#job_health');
            taskrow.DisplayLoading();
            require(['Scripts/ClientViews/Job/JobHealth'], function (ctor) {
                self.jobHealth = new ctor(tabHealthContent[0], self.serverData.Job.JobNumber);
                self.jobHealth.Init();
                self.SelectTabs("tab-health");
                taskrow.HideLoading();
            });
        }
        else
            this.SelectTabs('tab-health');
    };
    JobHome.prototype.SaveJobHealth_OnComplete = function (response) {
        if (taskrow.currentModule.jobHealth)
            taskrow.currentModule.jobHealth.SaveJobHealth_End.call(taskrow.currentModule, response);
    };
    //#endregion Tabs
    JobHome.prototype.ShowTaskList = function () {
        var self = this;
        self.ShowContainer('tasklistContainer');
        self.SetupListScroll();
    };
    JobHome.prototype.ShowContainer = function (containerID) {
        $('.job-home-container').not('#' + containerID).fadeOut();
        if (this.currentContainer != containerID)
            $('#' + containerID).fadeIn();
        this.currentContainer = containerID;
    };
    //#region Deliverable
    JobHome.prototype.ShowDeliverables = function () {
        var self = this;
        self.ShowContainer('deliverableListContainer');
        self.SetupListScroll();
    };
    JobHome.prototype.NewDeliverable = function () {
        $('.job-home-container .nav-tabs').children('li').removeClass('active');
        this.OpenDeliverable();
    };
    JobHome.prototype.OpenDeliverable = function (deliverableID) {
        var self = this;
        this.ShowDeliverables();
        if (deliverableID)
            $('#deliverableListContainer li[data-deliverableid=' + deliverableID + ']').addClass('active');
        var deliverableData = (!deliverableID) ?
            self.serverData.DeliverableModel :
            ko.utils.arrayFirst(self.viewModel.DeliverableList.OriginalData(), function (d) { return d.DeliverableID == deliverableID; });
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Job/Deliverable"], function (ctor) {
            if (self.currentDeliverable)
                self.currentDeliverable.Unload();
            self.currentDeliverable = new ctor();
            self.currentDeliverable.Init(self.serverData.Job.JobNumber, self.serverData.DeliverableTypeList, self.serverData.DeliverableStatusList, deliverableData);
            self.deliverableOpen = true;
            self.currentDeliverable.Show();
        });
    };
    JobHome.prototype.CloseDashboardDeliverable = function () {
        if (this.currentDeliverable)
            this.currentDeliverable.Unload();
        this.deliverableOpen = false;
        this.currentDeliverable = null;
        $('.job-deliverables').remove();
        $('.dashboard-content').show();
        $('#deliverableList').children('li').removeClass('active');
    };
    JobHome.prototype.CloseDeliverable = function () {
        this.CloseDashboardDeliverable();
        var jobUrl = '#companies/' + this.serverData.Job.Client.ClientNickName + '/' + this.serverData.Job.JobNumber + '/deliverable';
        if (location.hash != jobUrl)
            location.href = jobUrl;
    };
    JobHome.prototype.ToggleInactiveDeliverables = function () {
        if (this.viewModel.DeliverableList.Filters()['InactiveFilter'])
            this.viewModel.DeliverableList.RemoveFilter('InactiveFilter');
        else
            this.viewModel.DeliverableList.AddFilter('InactiveFilter', 'Inactive', [false, null]);
    };
    JobHome.prototype.ShowJobImportDeliverableModal = function () {
        var self = this;
        taskrow.DisplayLoading();
        $.ajax({
            url: 'Administrative/ListJobTemplate',
            data: {},
            success: function (data) {
                taskrow.HideLoading();
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    return false;
                }
                var importDeliverablesData = {
                    JobTemplateID: 0,
                    InvalidJobTemplateID: false,
                    JobTemplateList: data.JobTemplates
                };
                self.jobImportDeliverablesViewModel = new ViewModel(importDeliverablesData);
                self.jobImportDeliverablesViewModel['JobTemplateID'].subscribe(function (id) {
                    var valid = (id > 0);
                    if (valid)
                        self.jobImportDeliverablesViewModel['InvalidJobTemplateID'](false);
                });
                var modalOptions = new ModalWindowOptions();
                modalOptions.title = Resources.Deliverable.ImportDeliverables;
                modalOptions.closeButton = true;
                modalOptions.onClose = function () {
                    self.jobImportDeliverablesViewModel = null;
                    self.jobImportDeliverablesModal = null;
                    Utils.CleanNode($('#modal_jobImportDeliverables')[0]);
                };
                var btnSave = new ModalButton();
                btnSave.id = 'btnSaveImportDeliverables';
                btnSave.loadingText = Resources.Commons.Saving;
                btnSave.label = Resources.Commons.Save;
                btnSave.isPrimary = true;
                btnSave.action = function (e) {
                    var jobTemplateID = self.jobImportDeliverablesViewModel['JobTemplateID']();
                    if (!jobTemplateID) {
                        self.jobImportDeliverablesViewModel['InvalidJobTemplateID'](true);
                        $('#btnSaveImportDeliverables').removeAttr('disabled');
                        return;
                    }
                    self.SaveJobImportDeliverables(jobTemplateID);
                };
                modalOptions.buttons.push(btnSave);
                var btnCancel = new ModalButton();
                btnCancel.id = 'btnCancelImportDeliverables';
                btnCancel.label = Resources.Commons.Cancel;
                btnCancel.action = function (e) {
                    self.jobImportDeliverablesModal.close();
                };
                modalOptions.buttons.push(btnCancel);
                modalOptions.modalID = 'jobImportDeliverables';
                UI.ShowModal('Templates/Job/JobImportDeliverables', {}, modalOptions, function (Modal) {
                    ko.applyBindings(self.jobImportDeliverablesViewModel, $('#modal_jobImportDeliverables')[0]);
                    self.jobImportDeliverablesModal = Modal;
                });
            }
        });
    };
    JobHome.prototype.SaveJobImportDeliverables = function (jobTemplateID) {
        var self = this;
        taskrow.DisplayLoading();
        $('#btnSaveImportDeliverables').button('loading');
        $.ajax({
            url: 'Job/SaveJobImportDeliverables',
            data: { jobNumber: this.serverData.Job.JobNumber, jobTemplateID: jobTemplateID },
            success: function (data, status) {
                taskrow.HideLoading();
                $('#btnSaveImportDeliverables').button('reset');
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    return;
                }
                var deliverables = data.Entity;
                self.viewModel.DeliverableList.RefreshData(deliverables);
                self.SetupListScroll();
                self.jobImportDeliverablesModal.close();
            }
        });
    };
    //#endregion Deliverable
    JobHome.prototype.RefreshTimesheetJobType = function () {
        var self = this;
        //console.log(['this', this]);
        UI.ConfirmYesNo("Todos os registros da timesheet e dados da taxa de utilização serão atualizados para o tipo de projeto atual (" + this.serverData.Job.TypeName + "). Deseja realmente atualizar os lançamentos desse projeto?", function () {
            taskrow.DisplayLoading();
            $.ajax({
                url: 'Job/RefreshTimesheetJobType',
                data: { jobNumber: self.serverData.Job.JobNumber },
                success: function (data) {
                    taskrow.HideLoading();
                    if (data.Success == false) {
                        UI.Alert(data.Message);
                        return false;
                    }
                    UI.Alert('Lançamentos atualizados');
                }
            });
        });
    };
    return JobHome;
}());
function JobHomeViewModel(data) {
    var self = this;
    var originalData = data;
    self.JobData = ko.observable(data.Job);
    self.JobStatus = ko.observable(data.JobStatus);
    self.ShowMemoExpandButton = ko.observable(false);
    self.Permissions = ko.observable(data.Permissions);
    self.JobTaskList = new JobTaskListPartialModel(data);
    self.OnRefreshDataRequired = undefined;
    self.CurrentViewMode = ko.observable(TasklistViewMode.Standard);
    self.CurrentViewMode.subscribe(function (viewMode) {
        if (viewMode == 3)
            $('#divDashBoard').hide();
        else
            $('#divDashBoard').show();
    });
    self.JobTaskList.OnRefreshDataRequired = function (taskDonePeriod) {
        if (self.OnRefreshDataRequired) {
            self.OnRefreshDataRequired(taskDonePeriod);
        }
    };
    self.TasklistViewModeClass = ko.computed(function () {
        if (self.CurrentViewMode() == TasklistViewMode.Calendar)
            return 'calendar';
        if (self.CurrentViewMode() == TasklistViewMode.Wide)
            return 'wide';
        return '';
    }, self);
    self.GetDeliverableLabel = function (index) {
        var list = this.JobTaskList.FilteredTaskList();
        var item = list[index];
        return item.Deliverable ? item.Deliverable.Name : Resources.Deliverable.NoDeliverable;
    };
    self.TestNewDeliverable = function (index) {
        var list = this.JobTaskList.FilteredTaskList();
        var previousItem = index == 0 ? null : list[index - 1];
        var item = list[index];
        if (!item.Deliverable && (index == 0 || !previousItem.Deliverable))
            return false;
        if (!item.Deliverable)
            return true;
        if (!previousItem || !previousItem.Deliverable || previousItem.Deliverable.DeliverableID != item.Deliverable.DeliverableID)
            return true;
        return false;
    };
    self.RefreshData = function (data) {
        self.JobTaskList.RefreshData(data);
    };
    self.refreshJobData = function (jobData) {
        self.JobData(jobData);
        self.JobStatus(jobData.JobStatusID);
    };
    self.DeliverableList = new DataSource([]);
    self.DeliverableList.SetOrder({ Name: true });
    self.DeliverableList.FilterTextColumns(['Name', 'ExternalCode']);
    self.DeliverableList.AddFilter('InactiveFilter', 'Inactive', [false, null]);
    self.DeliverableList.RefreshData(data.Job.DeliverableList);
    self.JobPipelineSteps = ko.observableArray(data.JobPipeline.JobPipelineSteps);
    self.GetJobPipelineStepTitle = function (jobPipelineStepID) {
        if (!jobPipelineStepID)
            return '';
        var step = _(this.JobPipelineSteps()).findWhere({ JobPipelineStepID: jobPipelineStepID });
        if (step)
            return step.Title;
        return '';
    };
}
function JobTaskListPartialModel(data) {
    var self = this;
    self.TasklistTypeInProgress = 0;
    self.TasklistTypeDone = 1;
    self.TasklistTypeTodo = 2;
    self.PrefetchedPeriod = data.PrefetchedPeriod;
    self.OnRefreshDataRequired = undefined;
    self.OldJob = ko.observable(data.OldJob);
    var filter = function (newData, closed, closedDays) {
        var array = (closed ? newData.JobTaskList.Done : newData.JobTaskList.InProgress);
        if (!closedDays)
            return array;
        var _now = $M(null, true);
        var ret = _.filter(array, function (task) {
            return -$M(task.CloseDate, true).diff(_now, 'days') <= closedDays;
        });
        return ret;
    };
    //self.GetDeliverableLabel = function(index) {
    //    var list = this.FilteredTaskList();
    //    var item = list[index];
    //    return item.Deliverable ? item.Deliverable.Name : '';
    //}
    //self.TestNewDeliverable = function (index) {
    //    var list = this.FilteredTaskList();
    //    var previousItem = index == 0 ? null : list[index - 1];
    //    var item = list[index];
    //    if (!item.Deliverable && index == 0) return false;
    //    if (!item.Deliverable) return true;
    //    if (!previousItem || !previousItem.Deliverable || previousItem.Deliverable.DeliverableID == item.Deliverable.DeliverableID) return true;
    //    return false;
    //}
    self.RefreshData = function (newData) {
        self.PrefetchedPeriod = newData.PrefetchedPeriod;
        var refreshArray = function (list, name) {
            if (self[name])
                self[name](list);
            else {
                self[name] = ko.observableArray(list);
            }
        };
        refreshArray(filter(newData, false, 0), 'InProgress');
        refreshArray(filter(newData, true, 7), 'DoneLastWeek');
        refreshArray(filter(newData, true, 15), 'DoneLast2Weeks');
        refreshArray(filter(newData, true, 30), 'DoneLastMonth');
        refreshArray(filter(newData, true, 60), 'DoneLast2Months');
        //Categorias disponíveis
        var options = [];
        if (self.InProgress().length > 0)
            options.push({ order: 0, label: Resources.Job.InProgress });
        if (self.DoneLastWeek().length > 0)
            options.push({ order: 1, label: Resources.Job.DoneLastWeek });
        if (self.DoneLast2Weeks().length > 0)
            options.push({ order: 2, label: Resources.Job.DoneLast2Week });
        if (self.DoneLastMonth().length > 0)
            options.push({ order: 3, label: Resources.Job.DoneLastMonth });
        if (self.DoneLast2Months().length > 0)
            options.push({ order: 4, label: Resources.Job.DoneLast2Months });
        if (self.InProgress().length > 0 || self.OldJob())
            options.push({ order: 5, label: Resources.Job.JobTasklistHistory });
        if (options.length == 0)
            options.push({ order: 6, label: Resources.Job.JobEmpty });
        if (self.AvailableTasklists)
            self.AvailableTasklists(options);
        else
            self.AvailableTasklists = ko.observableArray(options);
        //recarregar lista selecionada
        if (self.SelectedTaskListIndex) {
            //se esta selecionado tarefas em andamento mas não possui nenhuma
            if (self.SelectedTaskListIndex() == 0 && self.InProgress().length == 0) {
                self.SelectedTaskListIndex(options[0].order);
            }
            //se esta selecionado tarefas encerradas mas não possui nenhuma
            else if (self.SelectedTaskListIndex() != 0 && self.SelectedTaskListIndex() != 5) {
                self.SelectedTaskListIndex(options[0].order);
            }
            if (taskrow.currentModule.constructor == JobHome)
                taskrow.currentModule.MarkCurrentTask();
        }
    };
    self.RefreshData(data);
    //Lista selecionada
    self.SelectedTaskListIndex = ko.observable((self.AvailableTasklists()[0] || { order: 0 }).order);
    self.CurrentTaskList = ko.computed(function () {
        if (self.SelectedTaskListIndex() == 0)
            return self.InProgress();
        if (self.SelectedTaskListIndex() == 1)
            return self.DoneLastWeek();
        if (self.SelectedTaskListIndex() == 2)
            return self.DoneLast2Weeks();
        if (self.SelectedTaskListIndex() == 3)
            return self.DoneLastMonth();
        if (self.SelectedTaskListIndex() == 4)
            return self.DoneLast2Months();
        if (self.SelectedTaskListIndex() == 5)
            return [];
        if (self.SelectedTaskListIndex() == 6)
            return [];
    }, self);
    self.CurrentTaskListName = ko.computed(function () {
        if (self.SelectedTaskListIndex() == 0)
            return Resources.Job.InProgress;
        if (self.SelectedTaskListIndex() == 1)
            return Resources.Job.DoneLastWeek;
        if (self.SelectedTaskListIndex() == 2)
            return Resources.Job.DoneLast2Week;
        if (self.SelectedTaskListIndex() == 3)
            return Resources.Job.DoneLastMonth;
        if (self.SelectedTaskListIndex() == 4)
            return Resources.Job.DoneLast2Months;
        if (self.SelectedTaskListIndex() == 5)
            return Resources.Job.JobTasklistHistory;
        if (self.SelectedTaskListIndex() == 6)
            return Resources.Job.JobEmpty;
    }, self);
    self.CalendarEnabled = ko.computed(function () {
        return self.SelectedTaskListIndex() == 0;
    }, self);
    //Filters
    self.FilterText = ko.observable('');
    self.FilterTags = ko.observableArray([]);
    self.FilterUsers = ko.observableArray([]);
    self.refreshFilters = function () {
        var previousSelectedTags = _.pluck(_.where(ko.toJS(self.FilterTags()), { 'Selected': true }), 'Value');
        var tags = _.map(_.uniq(_.flatten(_.pluck(self.CurrentTaskList(), 'Tags')), false, function (item) {
            return item.TagTitle;
        }), function (tag) {
            var selected = _.indexOf(previousSelectedTags, tag.TagTitle) > -1;
            return new DataItem(tag.TagTitle, tag.TagTitle, selected);
        });
        self.FilterTags(tags);
        var previousSelectedUsers = _.pluck(_.where(ko.toJS(self.FilterUsers()), { 'Selected': true }), 'Value');
        var users = _.map(_.uniq(self.CurrentTaskList(), false, function (task) {
            return task.OwnerUserID;
        }), function (task) {
            var selected = _.indexOf(previousSelectedUsers, task.OwnerUserID) > -1;
            var ret = new DataItem(task.OwnerUserLogin, task.OwnerUserID, selected);
            ret.UserHashCode = task.OwnerUserHashCode;
            return ret;
        });
        self.FilterUsers(users);
    };
    //Clear filters
    self.ClearFilterText = function () {
        self.FilterText("");
    };
    self.ClearTags = function () {
        _.forEach(self.FilterTags(), function (tag) { return tag.Selected(false); });
    };
    self.ClearUsers = function () {
        _.forEach(self.FilterUsers(), function (user) { return user.Selected(false); });
    };
    self.refreshFilters();
    self.CurrentTaskList.subscribe(function () {
        self.refreshFilters();
    });
    self.SelectedTaskListIndex.subscribe(function (index) {
        //caso seja historico geral
        if (index == 5)
            window.location.href = URLs.BuildUrl(taskrow.currentModule.serverData.Job.UrlData) + '/history';
        if (index > self.PrefetchedPeriod && self.OnRefreshDataRequired)
            self.OnRefreshDataRequired(index);
    });
    //Filtered tasklist
    self.FilteredTaskList = ko.computed(function () {
        var ret = self.CurrentTaskList();
        var fnFilter = function (task) {
            var _title = self.FilterText();
            if (_title && task.Title.toLocaleLowerCase().indexOf(_title.toLocaleLowerCase()) < 0)
                return false;
            var users = _.filter(self.FilterUsers(), function (user) { return user.Selected(); });
            if (users.length > 0 && !_.some(users, function (user) { return user.Value() == task.OwnerUserID; }))
                return false;
            var tags = _.filter(self.FilterTags(), function (tag) { return tag.Selected(); });
            if (tags.length > 0 && !_.some(tags, function (tag) {
                var tagTitle = tag.Value();
                return _.some(task.Tags, function (taskTag) {
                    return taskTag.TagTitle == tagTitle;
                });
            }))
                return false;
            return true;
        };
        var list = _.filter(ret, fnFilter);
        var orderedList = [];
        var parentTasks = _.chain(list)
            .filter(function (x) { return !x.ParentTaskID || (x.ParentTaskID > 0 && !_.any(list, function (l) { return l.TaskID == x.ParentTaskID; })); })
            .sortBy(function (x) { return x.DueDate; })
            .sortBy(function (x) { return x.DeliverableID; }).value();
        if (parentTasks.length > 0) {
            for (var i = 0; i < parentTasks.length; i++) {
                var parentTask = parentTasks[i];
                orderedList.push(parentTask);
                if (!parentTask.ParentTaskID) {
                    var subtasks = _.chain(list)
                        .filter(function (x) { return x.ParentTaskID == parentTask.TaskID; })
                        .sortBy(function (x) { return x.DueDate; })
                        .value();
                    for (var j = 0; j < subtasks.length; j++)
                        orderedList.push(subtasks[j]);
                }
            }
        }
        return orderedList;
    }, self);
    var onRefreshData = function () {
        setTimeout(function () {
            $('#tasklist').jsScroll();
        }, 300);
    };
    //Calendar
    self.CalendarTaskGroups = [
        { title: Resources.Commons.Tasks, pos: 0 }
    ];
    self.CalendarSelectedGroup = ko.observable(0);
    self.CalendarTasks = ko.computed(function () {
        var dtNow = $M(null, true);
        var filteredTasks = _.sortBy(self.FilteredTaskList(), function (x) { return $M(x.DueDate).toDate().getTime(); });
        var tasks = [
            filteredTasks
        ];
        var maxDates = [
            tasks[0].length ? $M(_.last(tasks[0]).DueDate, true) : dtNow
        ];
        var maxDate = _.max(maxDates);
        var minDate = dtNow.clone().add(-((6 + dtNow.day()) % 7), 'days').startOfDay();
        maxDate.add(7 - maxDate.day(), 'days').startOfDay();
        maxDate.add(Math.max(28 - maxDate.diff(minDate, 'days'), 0), 'days').startOfDay();
        var weeks = [];
        var monday = minDate.clone();
        var firstWeek = true;
        var indexes = [0];
        var taskStyles = ['open'];
        while (monday.valueOf() < maxDate.valueOf()) {
            var week = {
                Days: []
            };
            //Dias da semana
            for (var i = 0; i < 7; i++) {
                var day = { date: null, tasks: [], past: false, first: false, dayStyle: '' };
                day.date = monday.clone().add(i, 'days').startOfDay();
                day.first = (firstWeek && i == 0) || day.date.date() == 1;
                day.past = (day.date.diff(dtNow, 'days') < 0);
                day.dayStyle = [day.first ? 'first' : '', day.past ? 'past' : ''].join(' ').trim();
                var todayTasks = [];
                //Grupos de tasks (Recebidas, devolvidas, ...
                for (var iGroup = 0; iGroup < tasks.length; iGroup++) {
                    var iTask = indexes[iGroup];
                    todayTasks[iGroup] = [];
                    //Tasks do grupo
                    for (; iTask < tasks[iGroup].length; iTask++) {
                        var task = tasks[iGroup][iTask];
                        var dif = $M(task.DueDate, true).diff(day.date, 'days');
                        if (dif > 0)
                            break;
                        todayTasks[iGroup].push({
                            URL: URLs.BuildUrl(task.UrlData),
                            title: task.Title,
                            taskStyle: taskStyles[iGroup],
                            UserID: task.OwnerUserID,
                            UserLogin: task.OwnerUserLogin,
                            UserHashCode: task.OwnerUserHashCode,
                            EffortEstimation: task.EffortEstimation
                        });
                    }
                    indexes[iGroup] = iTask;
                }
                day.tasks = _.flatten(todayTasks);
                week.Days.push(day);
            }
            weeks.push(week);
            monday.add(7, 'days').startOfDay();
            firstWeek = false;
        }
        return weeks;
    }, self);
    self.FilteredTaskList.subscribe(function () { onRefreshData(); });
}
define(function () {
    return JobHome;
});
//# sourceMappingURL=JobHome.js.map