///<reference path="../../Main/App.ts"/>
///<reference path="../Task/TaskCentral.ts"/>
var Timesheet = /** @class */ (function () {
    function Timesheet() {
        this.timesheetModule = true;
        this.timesheetOvertimeAuthorization = null;
    }
    Timesheet.prototype.HasOwnMenu = function () {
        return true;
    };
    Timesheet.prototype.Setup = function (options) {
    };
    Timesheet.prototype.Unload = function () {
        Utils.CleanNode($('#dashboard')[0]);
        $(window).unbind('signalr:notifyTaskChange', this.listenTaskNotifications);
        $(window).unbind('resize');
        if (this.jobSearchBox)
            this.jobSearchBox.Unload();
        if (this.timesheetOvertimeAuthorization != null)
            this.timesheetOvertimeAuthorization.Unload();
    };
    Timesheet.prototype.SetupTasklistScroll = function () {
        setTimeout(function () {
            var $target = $('#timesheetTasklist');
            $('#tasklist', $target).height($('#timesheetTasklist').parent().parent().height() - 180);
            $('#tasklist', $target).scrollableAccordeon('refresh', true);
            $('#tasklist', $target).jsScroll();
            $('#tasklist', $target).attr('scrollEnabled', 'true');
            if ($('.dropdown-companies-project').length > 0)
                $('.dropdown-companies-project').jsScroll();
        }, 100);
    };
    Timesheet.prototype.SetupTaskNotificationListening = function () {
        var self = this;
        if (!this.listenTaskNotifications) {
            this.listenTaskNotifications = function (e, change) {
                if (change.JobID == self.serverData.JobID) {
                    self.NotifyTaskChange(change);
                }
            };
            $(window).bind('signalr:notifyTaskChange', this.listenTaskNotifications);
        }
    };
    Timesheet.prototype.PrepareTaskMessage = function (taskMessage) {
        taskMessage.DueDate = moment(taskMessage.DueDate).toJsonDate(true);
        taskMessage.CreationDate = moment(taskMessage.CreationDate).toJsonDate(true);
    };
    Timesheet.prototype.NotifyTaskChange = function (taskData) {
        if (taskData.ParentTaskID > 0)
            return;
        var tasklist = this.serverData.TaskList;
        var task = _(tasklist.OwnedTasks).findWhere({ "TaskID": taskData.TaskID });
        var taskAdded = false;
        this.PrepareTaskMessage(taskData);
        if (task) {
            var ix = tasklist.OwnedTasks.indexOf(task);
            tasklist.OwnedTasks.splice(ix, 1);
            var prevDueDate = '';
            var prevDueDateOrder = 0;
            for (var i = 0; i < tasklist.OwnedTasks.length; i++) {
                if (tasklist.OwnedTasks[i].DueDate == prevDueDate) {
                    tasklist.OwnedTasks[i].DueDateOrder = prevDueDateOrder + 1;
                    prevDueDateOrder++;
                }
                else {
                    prevDueDate = tasklist.OwnedTasks[i].DueDate;
                    tasklist.OwnedTasks[i].DueDateOrder = 1;
                    prevDueDateOrder = 1;
                }
            }
        }
        if (!taskData.Closed && taskData.OwnerUserID == environmentData.currentUserID) {
            taskAdded = true;
            //console.log(taskData.Title, taskData.DueDate, taskData.DueDateOrder);
            //Rearranja os DueDateOrder para poder encaixar a task nova
            tasklist.OwnedTasks = _(tasklist.OwnedTasks).sortBy(function (x) { return x.DueDate + (1000 + x.DueDateOrder).toString(); });
            var prevDueDate = '';
            var prevDueDateOrder = 0;
            for (var i = 0; i < tasklist.OwnedTasks.length; i++) {
                if (tasklist.OwnedTasks[i].DueDate == prevDueDate) {
                    tasklist.OwnedTasks[i].DueDateOrder = prevDueDateOrder + 1;
                    prevDueDateOrder++;
                }
                else {
                    prevDueDate = tasklist.OwnedTasks[i].DueDate;
                    tasklist.OwnedTasks[i].DueDateOrder = (prevDueDate == taskData.DueDate && taskData.DueDateOrder == 1) ? 2 : 1;
                    prevDueDateOrder = tasklist.OwnedTasks[i].DueDateOrder;
                }
                //console.log(prevDueDate == taskData.DueDate, prevDueDate, taskData.DueDate);
                if (prevDueDate == taskData.DueDate && prevDueDateOrder + 1 == taskData.DueDateOrder)
                    prevDueDateOrder++;
            }
            tasklist.OwnedTasks.push(taskData);
            tasklist.OwnedTasks = _(tasklist.OwnedTasks).sortBy(function (x) { return x.DueDate + (1000 + x.DueDateOrder).toString(); });
        }
        task = _(tasklist.DelegatedTasks).findWhere({ "TaskID": taskData.TaskID });
        if (task) {
            var ix = tasklist.DelegatedTasks.indexOf(task);
            tasklist.DelegatedTasks.splice(ix, 1);
        }
        if (!taskAdded && !taskData.Closed && taskData.CreationUserID == environmentData.currentUserID) {
            taskAdded = true;
            tasklist.DelegatedTasks.push(taskData);
            tasklist.DelegatedTasks = _(tasklist.DelegatedTasks).sortBy(function (x) { return x.DueDate + (1000 + x.DueDateOrder).toString(); });
        }
        task = _(tasklist.ParticipatedTasks).findWhere({ "TaskID": taskData.TaskID });
        if (task) {
            var ix = tasklist.ParticipatedTasks.indexOf(task);
            tasklist.ParticipatedTasks.splice(ix, 1);
        }
        if (!taskAdded && !taskData.Closed && taskData.CreationUserID != environmentData.currentUserID && taskData.OwnerUserID != environmentData.currentUserID) {
            taskAdded = true;
            tasklist.ParticipatedTasks.push(taskData);
            tasklist.ParticipatedTasks = _(tasklist.ParticipatedTasks).sortBy(function (x) { return x.DueDate + (1000 + x.DueDateOrder).toString(); });
        }
        //this.viewModel.RefreshTasklistData(this.serverData);
        this.viewModel.Tasklist.RefreshData(this.serverData);
    };
    Timesheet.prototype.Action = function (options) {
        var self = this;
        options = options || {};
        var sideAction = $.noop;
        if (options.selectTab)
            sideAction = function () {
                this.SelectTab(options.selectTab, options.tabOptions);
            }.bind(this);
        //se está exibindo as autorizacoes de horas adicionais, nao eh primeiro load, somente altera a 'tab'
        if (!options.reloadTimesheet && this.viewModel != null && this.viewModel.SelectedTab() == EnumTimesheetTab.OvertimeAuthorization) {
            sideAction();
        }
        //se for um primeiro load (reloadTimesheet == false), ou o action seja diferente ou o usuario seja outro, recarrega todos os dados
        else if (!options.reloadTimesheet || (options.actiontype && options.actiontype != self.ActionType) || options.userid != self.timesheetUser.UserID) {
            self.GetTimesheet(options.userid, options.actiontype, options.weekindex, sideAction);
        }
        //se for mesmo usuario porem semana diferente, recarrega apenas a semana
        else if (options.weekindex && self.serverData.TimesheetWeek.Week.WeekIndex != options.weekindex) {
            self.ReloadTimesheetWeek(options.weekindex);
        }
        if (environmentData.TimesheetLocked) {
            taskrow.EnqueueUserListRefresh(1, true);
            //console.log('force list users');
        }
    };
    Timesheet.prototype.SelectTab = function (tab, options) {
        options = options || {};
        if (tab == EnumTimesheetTab.OvertimeAuthorization) {
            if (!this.viewModel.OvertimeAuthorizationEnabled())
                return;
            if (!this.viewModel.CurrentUserHasDailyMinutesLimit())
                return;
            if (!this.timesheetOvertimeAuthorization)
                this.LoadOvertimeAuthorization(options);
        }
        this.viewModel.SelectedTab(tab);
    };
    //#region Overtime authorization
    Timesheet.prototype.LoadOvertimeAuthorization = function (options) {
        options = options || {};
        if (this.timesheetOvertimeAuthorization != null)
            return;
        if (this.serverData.User.UserID != environmentData.currentUserID)
            return;
        var self = this;
        options = _.extend(options, {
            timesheetFixedUser: {
                UserID: environmentData.currentUser.UserID,
                UserLogin: environmentData.currentUser.UserLogin,
                UserHashCode: environmentData.currentUser.UserHashCode
            }
        });
        require(['Scripts/ClientViews/Dashboard/TimesheetOvertimeAuthorization'], function (ctor) {
            self.timesheetOvertimeAuthorization = new ctor();
            self.timesheetOvertimeAuthorization.Init('timesheetOvertimeAuthorizationContainer', options);
        });
    };
    Timesheet.prototype.RequestOvertimeAuthorization = function (timesheetWeekDay) {
        this.timesheetOvertimeAuthorization.NewOvertimeAuthorization($M(timesheetWeekDay.Date, true), $M(timesheetWeekDay.Date, true));
    };
    //#endregion
    Timesheet.prototype.GetTimesheet = function (userid, actiontype, weekindex, sideAction) {
        var self = this;
        var mainContent = $('#main');
        var template = 'Timesheet/Timesheet', templateUrl = taskrow.templatePath + template, timesheetDataUrl = 'Timesheet/Timesheet', timesheetApprovalDataUrl = 'Timesheet/TimesheetApproval';
        if (this.timesheetOvertimeAuthorization != null) {
            this.timesheetOvertimeAuthorization.Unload();
            this.timesheetOvertimeAuthorization = null;
        }
        var dataUrl = (actiontype == TimesheetActionType.Approval) ? timesheetApprovalDataUrl : timesheetDataUrl;
        taskrow.DisplayLoading();
        $.get(dataUrl, { userid: userid, weekindex: weekindex }, function (data) {
            if (data.Success === false) {
                UI.Alert(data.Message);
                Navigation.GoBack();
                return;
            }
            self.SetData(data);
            self.viewModel = new TimesheetViewModel(data);
            self.viewModel.SetupEvents(function (data) { return self.SendToApproval(data); }, function (data) { return self.SendToEdit(data); }, function (data) { return self.ApproveTimesheetDay(data); }, function (data) { return self.DisapproveTimesheetDay(data); });
            //carrega os grupos quando ação é de aprovação ou quando usuário tem permissão de visualizar outras timesheets
            if (actiontype == TimesheetActionType.Approval || (actiontype == TimesheetActionType.Edit && self.serverData.Permissions.AllowShowTimesheet)) {
                GroupTimesheetApproval.GetUserGroup(function (data) {
                    self.viewModel.RefreshGroupsData(data);
                });
            }
            var templateData = $.extend(true, data, {
                EditMode: self.isEditMode,
                IsCurrentUserTimesheet: self.isCurrentUserTimesheet,
                CanAddEntries: (self.isEditMode && self.isCurrentUserTimesheet)
            });
            taskrow.LoadTemplate(templateUrl, function (getHTML) {
                taskrow.FinishLoadModule();
                mainContent.html(getHTML(templateData));
                ko.applyBindings(self.viewModel, $('#dashboard')[0]);
                self.LoadOvertimeAuthorization();
                Menu.LoadMenu(Menus.TaskMenu());
                sideAction();
                self.RefreshColumnsPosition();
                self.SetupWindowEvents();
                taskrow.HideLoading();
            });
            self.SetupTaskNotificationListening();
        });
    };
    Timesheet.prototype.SetupWindowEvents = function () {
        $(window).bind('resize', function (ev) {
            this.RefreshColumnsPosition();
        }.bind(this));
    };
    Timesheet.prototype.RefreshColumnsPosition = function () {
        this.viewModel.dummyCalcColumnWidth.notifySubscribers();
        this.RefreshDayColumnsScroll();
    };
    Timesheet.prototype.RefreshDayColumnsScroll = function () {
        var days = $('#timesheetBoard .column .column-tasks');
        if (days.length > 0) {
            _.each(days, function (day) {
                $(day).jsScroll();
            });
        }
    };
    Timesheet.prototype.SetData = function (data) {
        this.serverData = data;
        this.timesheetUser = data.User;
        this.ActionType = data.ActionType;
        this.isEditMode = (data.ActionType == TimesheetActionType.Edit);
        this.isCurrentUserTimesheet = (data.User.UserID == environmentData.currentUserID);
        this.UserRelationType = data.TimesheetWeek.UserRelationType;
    };
    Timesheet.prototype.CurrentSection = function () {
        return Section.TaskCentral;
    };
    Timesheet.prototype.CurrentContext = function () {
        return [];
    };
    Timesheet.prototype.CreateTasklistModal = function () {
        var self = this;
    };
    Timesheet.prototype.AddEntry = function (timesheetWeekDay, timesheetEntryType) {
        var self = this;
        if (timesheetEntryType == TimesheetEntryType.Task) {
            self.ShowTasklistModal(timesheetWeekDay);
        }
        else if (timesheetEntryType == TimesheetEntryType.Unallocated && timesheetWeekDay.UnallocatedTime().length > 0) {
            var unallocatedEntry = timesheetWeekDay.UnallocatedTime()[0];
            self.EditEntry(timesheetWeekDay, unallocatedEntry);
        }
        else if (timesheetEntryType == TimesheetEntryType.LooseEntry && (!self.serverData.JobEntryTypeList || self.serverData.JobEntryTypeList.length == 0)) {
            UI.Alert(Resources.Timesheet.JobEntryTypeNotFound);
            return false;
        }
        else {
            var entryData = {
                RowVersion: '0',
                TimesheetEntryID: 0,
                TimesheetEntryTypeID: timesheetEntryType,
                Approvals: [],
                MinutesSpent: '',
                MemoEntry: '',
                DayID: timesheetWeekDay.DayID
            };
            var entry = new TimesheetEntryPartialModel(entryData);
            self.EditEntry(timesheetWeekDay, entry);
        }
    };
    Timesheet.prototype.ShowTasklistModal = function (timesheetWeekDay) {
        var self = this;
        taskrow.DisplayLoading();
        //tarefas ja adicionadas que nao devem aparecer na lista de novas tarefas
        var shownEntries = _.filter(timesheetWeekDay.Entries(), function (t) { return t.MinutesSpent() > 0 || t.ModificationDate() == t.CreationDate(); });
        var excludeTasksIds = ko.utils.arrayMap(shownEntries, function (t) { return t.TaskID; });
        self.viewModel.Tasklist.Filters.FilterSettings.ExcludeTaskIds(excludeTasksIds);
        self.viewModel.MinutesRemainingDayReference(timesheetWeekDay.MinutesRemaining());
        self.viewModel.TotalMinutesDayReference(timesheetWeekDay.MinutesRemaining());
        //controlar tasks adicionadas
        self.viewModel.AddedTasks = ko.observable({});
        //modal edit timehseet
        var options = new ModalWindowOptions();
        options.title = Resources.Timesheet.EditTimesheet;
        options.closeButton = true;
        options.onClose = function () {
            //onClose callback
            self.timesheetAddentryModal = null;
            self.viewModel.Tasklist.Filters.FilterSettings.ExcludeTaskIds.removeAll();
            self.viewModel.Tasklist.Filters.FilterSettings.ClearFilterClientJob();
            self.viewModel.Tasklist.Filters.FilterSettings.FilterText('');
            self.viewModel.MinutesRemainingDayReference(0);
            self.viewModel.TotalMinutesDayReference(0);
            $('#tasklist', $('#timesheetTasklist')).jsScroll();
            Utils.CleanNode($('#timesheetTasklist')[0]);
        };
        //btn save
        var btnSave = new ModalButton();
        btnSave.label = Resources.Commons.Save;
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.id = 'btnSaveTimesheet';
        btnSave.isPrimary = true;
        btnSave.action = function (e) {
            self.SaveTimesheetEntries(timesheetWeekDay);
        };
        options.buttons.push(btnSave);
        options.style = 'width: 1000px;';
        options.onResize = self.SetupTasklistScroll;
        UI.ShowModal(taskrow.templatePath + 'Timesheet/TimesheetTasklist', {}, options, function (modal) {
            self.timesheetAddentryModal = modal;
            var $target = $('#timesheetTasklist');
            ko.applyBindings(self.viewModel, $target[0]);
            $('#tasklist', $target).scrollableAccordeon();
            $(window).addListener('resize', function () { $('#tasklist', $target).css('height', ''); });
            self.SetupTasklistScroll();
            $(window).trigger('taskrow:modalbodyresized');
            self.EnableSaveTimesheet(false);
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.EnableSaveTimesheet = function (allow) {
        //habilita ou desabilita a açao 'salvar timesheet'
        var $savetimesheetButton = $('#btnSaveTimesheet');
        if (allow)
            $savetimesheetButton.removeAttr('disabled').css('opacity', 1);
        else
            $savetimesheetButton.attr('disabled', 'disabled').css('opacity', 0.4);
    };
    Timesheet.prototype.SaveTimesheetEntries = function (timesheetWeekDay) {
        var self = this;
        var arrayTaskID = _.keys(self.viewModel.AddedTasks());
        var arrayMinutesSpent = _.values(self.viewModel.AddedTasks());
        if (arrayTaskID.length == 0 || !_.some(arrayMinutesSpent, function (x) { return parseInt(x) > 0; })) {
            if (self.timesheetAddentryModal != null)
                self.timesheetAddentryModal.close();
            self.viewModel.MinutesRemainingDayReference(0);
            self.viewModel.TotalMinutesDayReference(0);
            $('#btnSaveTimesheet').removeAttr('disabled');
            return;
        }
        taskrow.DisplayLoading();
        $('#btnSaveTimesheet').button('loading');
        $.ajax({
            url: "Timesheet/AddTimesheetTasks",
            type: "POST",
            data: {
                dayID: timesheetWeekDay.DayID,
                listTaskID: arrayTaskID.toString(),
                listMinutesSpent: arrayMinutesSpent.toString()
            },
            success: function (data) {
                taskrow.HideLoading();
                if (!data.Success) {
                    UI.Alert(data.Message, null, null, null, true);
                    return false;
                }
                var newTimesheetWeekDay = data.Entity;
                var newTimesheetWeekDayModel = new TimesheetWeekDayPartialModel(newTimesheetWeekDay, self.ActionType, self.timesheetUser.UserID, self.UserRelationType);
                self.viewModel.ReplaceTimesheetDay(timesheetWeekDay, newTimesheetWeekDayModel);
                if (self.timesheetAddentryModal != null)
                    self.timesheetAddentryModal.close();
                self.viewModel.MinutesRemainingDayReference(0);
                self.viewModel.TotalMinutesDayReference(0);
                self.RefreshColumnsPosition();
                $('#btnSaveTimesheet').button('reset');
                HeaderTimesheet.LoadTimesheetDayData();
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if (console)
                    console.error(textStatus);
            }
        });
    };
    Timesheet.prototype.AddTimesheetTask = function (e, task) {
        var self = this;
        var $taskButton = $('input.timepickerEntry[data-taskid=' + task.TaskID + ']');
        var taskMinutes = self.viewModel.AddedTasks()[task.TaskID];
        if (taskMinutes && parseInt(taskMinutes) > 0)
            $taskButton.attr('data-original-minutesspent', taskMinutes);
        $taskButton.timesheetpicker({
            buttonSize: 'small',
            containerClass: 'absolute',
            displayClass: 'btn pull-right',
            openStart: true,
            setTimecallback: function (minutesSpent) {
                self.viewModel.AddedTasks()[task.TaskID] = minutesSpent;
                var totalMinutesDay = self.viewModel.TotalMinutesDayReference();
                var totalAddedMinutes = _.sum(self.viewModel.AddedTasks());
                self.viewModel.MinutesRemainingDayReference(Math.max(0, totalMinutesDay - totalAddedMinutes));
                self.EnableSaveTimesheet(true);
            }
        });
        $(e.target).remove();
    };
    Timesheet.prototype.ActionBoxEntry = function (e, timesheetWeekDay, entry) {
        var self = this;
        //permite editar o entry caso esteja em modo de edição e seja a timesheet do usuário atual e o dia esteja em edição
        if (self.isEditMode && self.isCurrentUserTimesheet && !timesheetWeekDay.DayLocked() && timesheetWeekDay.DayStatusID() == TimesheetDayStatus.Edit) {
            if (entry.LongTermAbsenceID > 0 && entry.AbsenceType != null && entry.AbsenceType.LockAllocation == true && entry.ModificationUserID() == environmentData.currentUserID)
                self.EditBlockTimesheet(entry);
            else
                self.EditEntry(timesheetWeekDay, entry);
        }
        //permite aprovar/reprovar o entry caso esteja em modo de aprovação e não seja a timesheet do usuário atual e o dia esteja em aprovação
        else if (!self.isEditMode && !self.isCurrentUserTimesheet && !timesheetWeekDay.DayLocked() && timesheetWeekDay.DayStatusID() == TimesheetDayStatus.Approval) {
            self.ShowApproveEntryModal(timesheetWeekDay, entry);
        }
        else {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };
    Timesheet.prototype.EditEntry = function (timesheetWeekDay, entry) {
        //console.log(['EditEntry - entry', entry, ko.toJS(entry)]);
        var self = this;
        taskrow.DisplayLoading();
        //create entryViewModel
        var entryType = (entry.TimesheetEntryTypeID == TimesheetEntryType.Task) ? Resources.Timesheet.Task :
            (entry.TimesheetEntryTypeID == TimesheetEntryType.Absence) ? Resources.Timesheet.Absence :
                (entry.TimesheetEntryTypeID == TimesheetEntryType.Unallocated) ? Resources.Timesheet.Unallocated :
                    (entry.TimesheetEntryTypeID == TimesheetEntryType.Job) ? Resources.Timesheet.JobEntry :
                        (entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry) ? Resources.Timesheet.LooseEntry : '';
        var description = (entry.TimesheetEntryTypeID == TimesheetEntryType.Absence) ? Resources.Timesheet.AbsenceType :
            (entry.TimesheetEntryTypeID == TimesheetEntryType.Job || entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry) ? Resources.Timesheet.Job : Resources.Timesheet.Description;
        //console.log(['entry', entry, 'entry.toJS', ko.toJS(entry)]);
        this.currentEntryViewModel = {
            EntryType: entryType,
            Description: description,
            AbsenceTypeList: _.sortBy(self.serverData.AbsenceTypeList, function (x) { return x.Description; }),
            LatestJobs: ko.observableArray(self.serverData.LatestJobs),
            JobEntryTypeList: ko.observableArray(self.serverData.JobEntryTypeList),
            NeedJobEntryType: (self.serverData.JobEntryTypeList.length > 1),
            MinutesRemaining: timesheetWeekDay.MinutesRemaining(),
            Entry: entry,
            KeepOnEditModal: false,
            EntryTypeExist: ko.computed(function () {
                var absenceTypeID = entry.AbsenceTypeID();
                var jobEntryTypeID = entry.JobEntryTypeID();
                //console.log(['EntryTypeExist', 'absenceTypeID', absenceTypeID, 'jobEntryTypeID', jobEntryTypeID]);
                if (absenceTypeID > 0 && _.any(timesheetWeekDay.Absences(), function (absence) { return absence.MinutesSpent() > 0 && absence.TimesheetEntryID != entry.TimesheetEntryID && absence.AbsenceTypeID() == absenceTypeID; }))
                    return true;
                if (jobEntryTypeID > 0 && _.any(timesheetWeekDay.JobEntries(), function (jobEntry) { return jobEntry.MinutesSpent() > 0 && jobEntry.TimesheetEntryID != entry.TimesheetEntryID && jobEntry.JobEntryTypeID() == jobEntryTypeID; }))
                    return true;
                return false;
            }, this.currentEntryViewModel),
            EntryTypeExistAlert: ko.computed(function () {
                var entryTypeDesc = '';
                var type = '';
                if (entry.TimesheetEntryTypeID == TimesheetEntryType.Absence) {
                    entryTypeDesc = 'lançamento de ausência';
                    var absenceType = _.filter(self.serverData.AbsenceTypeList, function (x) { return x.AbsenceTypeID == entry.AbsenceTypeID(); })[0];
                    if (absenceType)
                        type = absenceType.Name.toLowerCase();
                }
                else {
                    entryTypeDesc = (entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry) ? entryType.toLowerCase() : (entry.TimesheetEntryTypeID == TimesheetEntryType.Job ? ' lançamento' : '');
                    entryTypeDesc += ' nesse mesmo projeto';
                    var jobEntryType = _.filter(self.serverData.JobEntryTypeList, function (x) { return x.JobEntryTypeID == entry.JobEntryTypeID(); })[0];
                    if (jobEntryType)
                        type = jobEntryType.Name.toLowerCase();
                }
                return "* Um " + entryTypeDesc + " do tipo " + type + " j\u00E1 existe nesse mesmo dia e ser\u00E1 substitu\u00EDdo ao salvar esse novo apontamento!";
            }, this.currentEntryViewModel)
        };
        var isLooseEntry = (entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry);
        var isJobEntry = (entry.TimesheetEntryTypeID == TimesheetEntryType.Job);
        if ((isJobEntry || isLooseEntry) && entry.TimesheetEntryID > 0) {
            this.currentEntryViewModel.Entry.LooseJobEntriesAllowed(true);
            this.currentEntryViewModel.Entry.JobStatus(EnumJobStatus.Open);
            this.currentEntryViewModel.Entry.JobClosingDate(null);
            this.currentEntryViewModel.Entry.IsJobMember(true);
            this.currentEntryViewModel.Entry.DeliverableRequired(entry.DeliverableID() > 0);
        }
        //modal edit timehseet
        var options = new ModalWindowOptions();
        options.title = Resources.Timesheet.EditTimesheet;
        options.closeButton = true;
        options.onClose = function () {
            //onClose callback
            self.timesheetEditEntryModal = null;
            self.currentEditTimesheetWeekDay = null;
            self.currentEntryViewModel = null;
            if (self.jobSearchBox) {
                self.jobSearchBox.Unload();
                self.jobSearchBox = null;
            }
            Utils.CleanNode($('#modal_timesheetentry')[0]);
        };
        var submitTimesheetEntryFn = function (e) {
            var jobEntryValid = $('#frmEditTimesheet').valid() &&
                (!isJobEntry ||
                    (self.currentEntryViewModel.Entry.LooseJobEntriesAllowed()
                        && self.currentEntryViewModel.Entry.JobDateAllowed()
                        && self.currentEntryViewModel.Entry.JobStatus() == EnumJobStatus.Open));
            var looseEntryValid = $('#frmEditTimesheet').valid() &&
                (!isLooseEntry ||
                    (self.currentEntryViewModel.Entry.JobDateAllowed()
                        && self.currentEntryViewModel.Entry.JobStatus() == EnumJobStatus.Open
                        && self.currentEntryViewModel.Entry.JobEntryTypeID() > 0
                    //&& self.currentEntryViewModel.Entry.IsJobMember() /*remover necessidade de ser efetivamente membro, se tem acesso pode lançar*/
                    ));
            var deliverableValid = (!isLooseEntry && !isJobEntry) ||
                !self.currentEntryViewModel.Entry.DeliverableRequired() ||
                self.currentEntryViewModel.Entry.DeliverableID() > 0;
            self.currentEntryViewModel.Entry.InvalidDeliverable(!deliverableValid);
            var valid = jobEntryValid && looseEntryValid && deliverableValid;
            //console.log(['jobEntryValid, looseEntryValid, deliverableValid', jobEntryValid, looseEntryValid, deliverableValid]);
            if (valid) {
                taskrow.DisplayLoading();
                _.each(options.buttons, function (btn) {
                    if (btn.id == self.currentEntryViewModel.btnID)
                        $('#' + btn.id).button('loading');
                    else
                        $('#' + btn.id).attr('disabled', 'disabled');
                }, this);
                $('#frmEditTimesheet').submit();
            }
            else {
                _.each(options.buttons, function (btn) {
                    //console.log(['btn.id', btn.id, 'self.currentEntryViewModel.btnID']);
                    $('#' + btn.id).button('reset');
                    $('#' + btn.id).removeAttr('disabled');
                }, this);
            }
        };
        //Salvar e continuar preenchendo
        if (!self.currentEntryViewModel.Entry.TimesheetEntryID) {
            var btnSaveAndContinue = new ModalButton();
            btnSaveAndContinue.label = Resources.Timesheet.SaveAndContinueEditing;
            btnSaveAndContinue.loadingText = Resources.Commons.Saving;
            btnSaveAndContinue.id = 'btnSaveAndContinueTimesheetEntry';
            btnSaveAndContinue.isPrimary = true;
            btnSaveAndContinue.action = function (e) {
                self.currentEntryViewModel.KeepOnEditModal = true;
                self.currentEntryViewModel.btnID = btnSaveAndContinue.id;
                submitTimesheetEntryFn(e);
            };
            options.buttons.push(btnSaveAndContinue);
        }
        //Excluir
        if (self.currentEntryViewModel.Entry.TimesheetEntryID > 0 && self.currentEntryViewModel.Entry.UserCanEdit()) {
            var btnDeleteTimesheetEntry = new ModalButton();
            btnDeleteTimesheetEntry.label = Resources.Timesheet.DeleteTimesheetEntry;
            btnDeleteTimesheetEntry.loadingText = Resources.Commons.Deleting;
            btnDeleteTimesheetEntry.id = 'btnDeleteTimesheetEntry';
            btnDeleteTimesheetEntry.isPrimary = false;
            btnDeleteTimesheetEntry.action = function (e) {
                UI.ConfirmYesNo(Resources.Timesheet.ConfirmDeleteTimesheetEntry, function () {
                    $('#modal_timesheetentry input.timepickerEntry').timesheetpicker('setMinutes', 0);
                    self.currentEntryViewModel.btnID = btnDeleteTimesheetEntry.id;
                    submitTimesheetEntryFn(e);
                }, null, null, null, null, true);
            };
            options.buttons.push(btnDeleteTimesheetEntry);
        }
        //btn save
        var btnSave = new ModalButton();
        btnSave.label = Resources.Commons.Save;
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.id = 'btnSaveTimesheetEntry';
        btnSave.isPrimary = true;
        btnSave.action = function (e) {
            self.currentEntryViewModel.KeepOnEditModal = false;
            self.currentEntryViewModel.btnID = btnSave.id;
            submitTimesheetEntryFn(e);
        };
        options.buttons.push(btnSave);
        options.style = (isJobEntry || isLooseEntry) ? 'width: 800px;' : 'width: 650px;';
        UI.ShowModal(taskrow.templatePath + 'Timesheet/TimesheetEntry', {}, options, function (Modal) {
            self.timesheetEditEntryModal = Modal;
            self.currentEditTimesheetWeekDay = timesheetWeekDay;
            ko.applyBindings(self.currentEntryViewModel, $('#modal_timesheetentry')[0]);
            $('input.timepickerEntry[data-entryid=' + entry.TimesheetEntryID + ']').timesheetpicker({
                containerClass: 'absolute',
                openStart: true
            });
            Utils.SetupValidation($('#frmEditTimesheet')[0]);
            if (isJobEntry || isLooseEntry)
                self.SetupJobSearchContext(entry, true);
            self.SetupTasklistScroll();
            $(window).trigger('taskrow:modalbodyresized');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.SelectJobEntryContext = function (item) {
        if (this.jobSearchBox) {
            //console.log(['SelectJobEntryContext', item]);
            var context = [{ Label: item.ClientDisplayName, Name: "clientID", URL: URLs.BuildUrl({ ClientNickName: item.ClientNickName }, 'client'), Value: item.ClientID },
                { Label: item.JobTitle, Name: "jobID", URL: URLs.BuildUrl({ ClientNickName: item.ClientNickName, JobNumber: item.JobNumber }, 'job'), Value: item.JobID }];
            this.jobSearchBox.RefreshContext(context);
        }
        this.currentEntryViewModel.Entry.ClientID(item.ClientID);
        this.currentEntryViewModel.Entry.JobID(item.JobID);
        var isLooseEntry = (this.currentEntryViewModel.Entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry);
        this.CheckLooseJobEntriesAllowed(item.JobID, isLooseEntry, $.noop);
    };
    Timesheet.prototype.SetupJobSearchContext = function (entry, ignoreCheck) {
        var self = this;
        var searchContextBox = $('#timesheetJobSearchContextBox')[0];
        if (this.jobSearchBox != null)
            this.jobSearchBox.Unload();
        var isLooseEntry = entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry;
        var isJobEntry = entry.TimesheetEntryTypeID == TimesheetEntryType.Job;
        var entryContext = [];
        if ((isJobEntry || isLooseEntry) && entry.TimesheetEntryID > 0) {
            entryContext = [{ Label: entry.ClientDisplayName, Name: "clientID", URL: URLs.BuildUrl({ ClientNickName: entry.ClientNickName }, 'client'), Value: entry.ClientID() },
                { Label: entry.JobTitle, Name: "jobID", URL: URLs.BuildUrl({ ClientNickName: entry.ClientNickName, JobNumber: entry.JobNumber }, 'job'), Value: entry.JobID() }];
            if (entry.DeliverableID() > 0)
                entryContext.push({
                    Label: entry.DeliverableName, Name: 'deliverableID',
                    URL: URLs.BuildUrl({ ClientNickName: entry.ClientNickName, JobNumber: entry.JobNumber, DeliverableID: entry.DeliverableID() }, 'deliverable'),
                    Value: entry.DeliverableID()
                });
            self.currentEntryViewModel.Entry.ClientID(entry.ClientID());
            if (!ignoreCheck) {
                self.CheckLooseJobEntriesAllowed(entry.JobID(), isLooseEntry, function () {
                    self.currentEntryViewModel.Entry.JobID(entry.JobID());
                    $(window).trigger('taskrow:modalbodyresized');
                });
            }
        }
        this.jobSearchBox = new ContextSearch(searchContextBox, entryContext, ContextSearchMode.Selection, Resources.Task.SearchClientAndJob);
        this.jobSearchBox.searchTasks = false;
        this.jobSearchBox.timesheetSearchDeliverable = true;
        //this.jobSearchBox.searchDeliverables = false;
        //nao permitir editar o projeto de um lançamento
        var disableSearch = (entry.TimesheetEntryID > 0 || entry.TimesheetAutoFulfillID() > 0);
        this.jobSearchBox.lockSearch = this.jobSearchBox.lockDelete = disableSearch;
        this.jobSearchBox.searchJobs = this.jobSearchBox.searchClients = this.jobSearchBox.searchProducts = this.jobSearchBox.searchDeliverables = !disableSearch;
        this.jobSearchBox.selectItemCallback = function (item) {
            if (item.ClientID && item.ClientID > 0)
                self.currentEntryViewModel.Entry.ClientID(item.ClientID);
            if (item.JobID && item.JobID > 0) {
                var checkExistsEntryFn = function (data) {
                    var existsJob = _.find(self.currentEditTimesheetWeekDay.JobEntries(), function (jobEntry) {
                        return jobEntry.MinutesSpent() > 0 && jobEntry.JobID() == data.JobID &&
                            ((!jobEntry.DeliverableID() && !data.DeliverableID) || (data.DeliverableID == jobEntry.DeliverableID()));
                    });
                    if (existsJob) {
                        $('#modal_timesheetentry input.timepickerEntry').attr('data-original-minutesspent', existsJob.MinutesSpent());
                        $('#modal_timesheetentry input.timepickerEntry').timesheetpicker('setMinutes', existsJob.MinutesSpent());
                        self.currentEntryViewModel.Entry.MinutesSpent(existsJob.MinutesSpent());
                    }
                };
                if (item.DeliverableID > 0) {
                    if (item.DeliverableID != self.currentEntryViewModel.Entry.DeliverableID())
                        checkExistsEntryFn(item);
                    self.currentEntryViewModel.Entry.DeliverableID(item.DeliverableID);
                    self.currentEntryViewModel.Entry.InvalidDeliverable(false);
                }
                if (item.JobID != self.currentEntryViewModel.Entry.JobID()) {
                    self.CheckLooseJobEntriesAllowed(item.JobID, isLooseEntry, function () {
                        self.currentEntryViewModel.Entry.JobID(item.JobID);
                        checkExistsEntryFn(item);
                    });
                }
            }
        };
        this.jobSearchBox.deleteItemCallback = function (context) {
            self.ClearJobContext();
            for (var i = 0; i < context.length; i++) {
                var item = context[i];
                if (item.Name == "clientID")
                    self.currentEntryViewModel.Entry.ClientID(item.Value);
                else if (item.Name == "jobID")
                    self.currentEntryViewModel.Entry.JobID(item.Value);
                else if (item.Name == "deliverableID")
                    self.currentEntryViewModel.Entry.DeliverableID(item.Value);
            }
        };
        this.jobSearchBox.resetContextCallback = function (context) {
            self.ClearJobContext();
        };
        this.jobSearchBox.Init();
    };
    Timesheet.prototype.CheckLooseJobEntriesAllowed = function (jobID, isLooseEntry, callback) {
        if (!jobID)
            return false;
        var self = this;
        taskrow.DisplayLoading();
        $.get('Job/CheckLooseJobEntriesAllowed', { jobID: jobID }, function (data) {
            taskrow.HideLoading();
            self.currentEntryViewModel.Entry.LooseJobEntriesAllowed(data.Allowed || isLooseEntry);
            self.currentEntryViewModel.Entry.JobClosingDate(data.ClosingDate);
            self.currentEntryViewModel.Entry.JobStatus(data.JobStatus);
            self.currentEntryViewModel.Entry.IsJobMember(data.IsJobMember);
            self.currentEntryViewModel.Entry.DeliverableRequired(data.DeliverableRequired);
            self.currentEntryViewModel.Entry.InvalidDeliverable(false);
            $(window).trigger('taskrow:modalbodyresized');
            if (callback)
                callback();
        });
    };
    Timesheet.prototype.ClearJobContext = function () {
        //console.log(['ClearJobContext']);
        this.currentEntryViewModel.Entry.DeliverableID(null);
        this.currentEntryViewModel.Entry.InvalidDeliverable(false);
        this.currentEntryViewModel.Entry.JobID(null);
        this.currentEntryViewModel.Entry.ClientID(null);
        $(window).trigger('taskrow:modalbodyresized');
    };
    Timesheet.prototype.UpdateTimesheet_OnSuccess = function (data) {
        $('#btnSaveTimesheetEntry, #btnSaveAndContinueTimesheetEntry').button('reset');
        taskrow.HideLoading();
        if (!data.Success) {
            UI.Alert(data.Message, null, null, null, true);
            return;
        }
        var updatedTimesheetDay = data.Entity;
        var self2 = taskrow.currentModule;
        var newTimesheetWeekDayModel = new TimesheetWeekDayPartialModel(updatedTimesheetDay, self2.ActionType, self2.timesheetUser.UserID, self2.UserRelationType);
        self2.viewModel.ReplaceTimesheetDay(self2.currentEditTimesheetWeekDay, newTimesheetWeekDayModel);
        self2.currentEditTimesheetWeekDay = newTimesheetWeekDayModel;
        if (self2.timesheetEditEntryModal != null) {
            //adicionando/reposicionando o ultimo projeto
            if (self2.currentEntryViewModel && (self2.currentEntryViewModel.Entry.TimesheetEntryTypeID == TimesheetEntryType.Job || self2.currentEntryViewModel.Entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry)) {
                var lastestJobID = self2.currentEntryViewModel.Entry.JobID();
                var existingLatestJob = _.findWhere(self2.serverData.LatestJobs, { 'JobID': lastestJobID });
                if (existingLatestJob) {
                    var indexToRemove = self2.serverData.LatestJobs.indexOf(existingLatestJob);
                    if (indexToRemove > -1)
                        self2.serverData.LatestJobs.splice(indexToRemove, 1);
                }
                var lastestJob = _.findWhere(updatedTimesheetDay.JobEntries, { 'JobID': lastestJobID });
                if (lastestJob) {
                    var length = self2.serverData.LatestJobs.unshift(lastestJob);
                    if (length > 5)
                        self2.serverData.LatestJobs.length = 5;
                    self2.currentEntryViewModel.LatestJobs(self2.serverData.LatestJobs);
                }
            }
            if (self2.currentEntryViewModel.Entry.TimesheetEntryID > 0 || !self2.currentEntryViewModel.KeepOnEditModal) {
                self2.timesheetEditEntryModal.close();
            }
            else {
                self2.currentEntryViewModel.MinutesRemaining = updatedTimesheetDay.NotProvidedTime;
                $('#modal_timesheetentry input.timepickerEntry').attr('data-remaining', updatedTimesheetDay.NotProvidedTime);
                $('#modal_timesheetentry input.timepickerEntry').timesheetpicker('reset');
                self2.currentEntryViewModel.Entry.Reset();
                self2.ClearJobContext();
                if (self2.jobSearchBox)
                    self2.jobSearchBox.RefreshContext([]);
            }
        }
        self2.RefreshColumnsPosition();
        HeaderTimesheet.LoadTimesheetDayData();
        Pendings.RefreshData();
        taskrow.currentModule.VerifyTimesheetLock();
    };
    Timesheet.prototype.VerifyTimesheetLock = function () {
        $.get('Main/IsTimesheetLocked', function (locked) {
            environmentData.TimesheetLocked = locked;
        });
    };
    Timesheet.prototype.SendToEdit = function (timesheetWeekDay) {
        var self = this;
        taskrow.DisplayLoading();
        $('#btnSendToEdit' + timesheetWeekDay.DayID).button('loading');
        $.post('Timesheet/SendtoUserEdit', { timesheetDayID: timesheetWeekDay.TimesheetDayID }, function (data) {
            if (data.Success) {
                var newTimesheetWeekDay = data.Entity;
                var newTimesheetWeekDayModel = new TimesheetWeekDayPartialModel(newTimesheetWeekDay, self.ActionType, self.timesheetUser.UserID, self.UserRelationType);
                self.viewModel.ReplaceTimesheetDay(timesheetWeekDay, newTimesheetWeekDayModel);
                self.RefreshColumnsPosition();
            }
            else {
                UI.Alert(data.Message);
            }
            $('#btnSendToEdit' + timesheetWeekDay.DayID).button('reset');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.SendToApproval = function (timesheetWeekDay) {
        var self = this;
        var allowSendIncompleteTimesheet = this.UserRelationType && this.UserRelationType.AllowSendIncompleteTimesheet;
        if (!allowSendIncompleteTimesheet && timesheetWeekDay.NotProvidedTime > 0) {
            UI.Alert(Resources.Timesheet.CompleteToSendToApproval);
            return false;
        }
        taskrow.DisplayLoading();
        $('#btnSendToApproval' + timesheetWeekDay.DayID).button('loading');
        $.post('Timesheet/SendtoApproval', { timesheetDayID: timesheetWeekDay.TimesheetDayID }, function (data) {
            taskrow.HideLoading();
            $('#btnSendToApproval' + timesheetWeekDay.DayID).button('reset');
            if (!data.Success) {
                UI.Alert(data.Message);
                return false;
            }
            var weeksPendingTimesheet = data.Entity.WeeksPendingTimesheet;
            self.viewModel.WeeksPendingTimesheet(weeksPendingTimesheet);
            var newTimesheetWeekDay = data.Entity.TimesheetDay;
            var newTimesheetWeekDayModel = new TimesheetWeekDayPartialModel(newTimesheetWeekDay, self.ActionType, self.timesheetUser.UserID, self.UserRelationType);
            self.viewModel.ReplaceTimesheetDay(timesheetWeekDay, newTimesheetWeekDayModel);
            self.RefreshColumnsPosition();
            HeaderTimesheet.LoadTimesheetDayData();
            if (environmentData.TimesheetLocked) {
                $.get('/Main/IsTimesheetLocked', {}, function (locked) {
                    if (!locked) {
                        UI.ConfirmYesNo(Resources.Timesheet.UnlockTimesheetRedirectConfirm, function () {
                            location.href = './?__redirect=1';
                        }, function () {
                            environmentData.TimesheetLocked = false;
                        }, null, Resources.Timesheet.GoToDesktop, Resources.Timesheet.StayInTimesheet);
                    }
                });
            }
        });
    };
    Timesheet.prototype.ApproveTimesheetDay = function (timesheetWeekDay) {
        this.UpdateStatusTimesheetDay.call(this, timesheetWeekDay, true);
    };
    Timesheet.prototype.DisapproveTimesheetDay = function (timesheetWeekDay) {
        var self = this;
        Timesheet.ShowDisapproveTimesheetDayModal(timesheetWeekDay, function (comment) {
            self.UpdateStatusTimesheetDay.call(self, timesheetWeekDay, false, comment);
        });
    };
    Timesheet.ShowDisapproveTimesheetDayModal = function (timesheetWeekDay, disapproveCallback) {
        var disapproveTimesheetDayModal = null;
        var timesheetDayEntriesViewModel = {
            TimesheetEntries: [{
                    Type: Resources.Task.Tasks,
                    Entries: _.map(_.filter(timesheetWeekDay.Entries(), function (e) { return e.MinutesSpent() > 0; }), function (e) {
                        return {
                            Title: e.ClientDisplayName + " / #" + e.JobNumber + " " + e.JobTitle + " / #" + e.TaskNumber + " " + e.TaskTitle,
                            FormatMinutesSpent: e.FormatMinutesSpent(),
                            MemoEntry: e.MemoEntry(),
                            Note: ''
                        };
                    })
                },
                {
                    Type: Resources.Job.Jobs,
                    Entries: _.map(_.filter(timesheetWeekDay.JobEntries(), function (e) { return e.MinutesSpent() > 0; }), function (j) {
                        var jobEntryTitle = j.ClientDisplayName + " / #" + j.JobNumber + " " + j.JobTitle;
                        if (j.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry && j.JobEntryType != '')
                            jobEntryTitle += " / " + j.JobEntryType;
                        return {
                            Title: jobEntryTitle,
                            FormatMinutesSpent: j.FormatMinutesSpent(),
                            MemoEntry: j.MemoEntry(),
                            Note: j.TimesheetAutoFulfillID() > 0 ? Resources.Timesheet.AutoFulfill : ''
                        };
                    })
                },
                {
                    Type: Resources.Absence.Absences,
                    Entries: _.map(_.filter(timesheetWeekDay.Absences(), function (e) { return e.MinutesSpent() > 0; }), function (a) {
                        return {
                            Title: Resources.Timesheet.Absence + " / " + a.AbsenceTypeName,
                            FormatMinutesSpent: a.FormatMinutesSpent(),
                            MemoEntry: a.MemoEntry(),
                            Note: (a.AbsenceType || {}).HumanResourceRestricted ? Resources.Timesheet.HumanResourceRestrictedAbsence : ''
                        };
                    })
                },
                {
                    Type: Resources.Timesheet.UnallocatedTime,
                    Entries: _.map(_.filter(timesheetWeekDay.UnallocatedTime(), function (e) { return e.MinutesSpent() > 0; }), function (u) {
                        return {
                            Title: Resources.Timesheet.UnallocatedTime,
                            FormatMinutesSpent: u.FormatMinutesSpent(),
                            MemoEntry: u.MemoEntry(),
                            Note: ''
                        };
                    })
                }]
        };
        //modal edit timehseet
        var options = new ModalWindowOptions();
        options.title = Resources.Timesheet.DisapproveTimesheetDay;
        options.closeButton = true;
        options.onClose = function () {
            //onClose callback
            disapproveTimesheetDayModal = null;
            Utils.CleanNode($('#modal_day_disapprove')[0]);
        };
        //btn cancel
        var btnCancel = new ModalButton();
        btnCancel.label = Resources.Commons.Cancel;
        btnCancel.loadingText = Resources.Commons.Canceling;
        btnCancel.id = 'btnCancelDisapproveTimesheetDay';
        btnCancel.action = function (e) {
            if (disapproveTimesheetDayModal)
                disapproveTimesheetDayModal.close();
        };
        options.buttons.push(btnCancel);
        //btn disapprove
        var btnDisapprove = new ModalButton();
        btnDisapprove.label = Resources.Timesheet.Disapprove;
        btnDisapprove.loadingText = Resources.Timesheet.Disapproving;
        btnDisapprove.id = 'btnDisapproveTimesheetDay';
        btnDisapprove.isPrimary = true;
        btnDisapprove.action = function (e) {
            var comment = $('#modal_day_disapprove #txtDisapproveComment').val();
            disapproveCallback(comment);
            if (disapproveTimesheetDayModal)
                disapproveTimesheetDayModal.close();
        };
        options.buttons.push(btnDisapprove);
        options.style = 'width: 800px;';
        UI.ShowModal(taskrow.templatePath + 'Timesheet/TimesheetDayDisapproveModal', {}, options, function (Modal) {
            disapproveTimesheetDayModal = Modal;
            ko.applyBindings(timesheetDayEntriesViewModel, $('#modal_day_disapprove')[0]);
            $(window).trigger('taskrow:modalbodyresized');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.UpdateStatusTimesheetDay = function (timesheetWeekDay, approve, comment) {
        var self = this;
        var $button = (approve) ? $('#btnApprove' + timesheetWeekDay.DayID) : $('#btnDisapprove' + timesheetWeekDay.DayID);
        taskrow.DisplayLoading();
        $button.button('loading');
        $.post('Timesheet/ApproveTimesheetDay', { timesheetDayID: timesheetWeekDay.TimesheetDayID, approve: approve, comment: comment }, function (data) {
            $button.button('reset');
            taskrow.HideLoading();
            if (data.Success == false) {
                UI.Alert(data.Message, null, null, null, true);
                return false;
            }
            var newTimesheetWeekDay = data.Entity;
            var newTimesheetWeekDayModel = new TimesheetWeekDayPartialModel(newTimesheetWeekDay, self.ActionType, self.timesheetUser.UserID, self.UserRelationType);
            self.viewModel.ReplaceTimesheetDay(timesheetWeekDay, newTimesheetWeekDayModel);
            self.RefreshColumnsPosition();
            Pendings.RefreshData();
        });
    };
    Timesheet.prototype.ShowApproveEntryModal = function (timesheetWeekDay, entry) {
        var self = this;
        //create entryViewModel
        var entryType = (entry.TimesheetEntryTypeID == TimesheetEntryType.Task) ? Resources.Timesheet.Task :
            (entry.TimesheetEntryTypeID == TimesheetEntryType.Absence) ? Resources.Timesheet.Absence :
                (entry.TimesheetEntryTypeID == TimesheetEntryType.Unallocated) ? Resources.Timesheet.Unallocated :
                    (entry.TimesheetEntryTypeID == TimesheetEntryType.Job) ? Resources.Timesheet.JobEntry :
                        (entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry) ? Resources.Timesheet.LooseEntry : '';
        var description = (entry.TimesheetEntryTypeID == TimesheetEntryType.Absence) ? Resources.Timesheet.AbsenceType :
            (entry.TimesheetEntryTypeID == TimesheetEntryType.Job || entry.TimesheetEntryTypeID == TimesheetEntryType.LooseEntry) ? Resources.Timesheet.Job :
                Resources.Timesheet.Description;
        var entryViewModel = {
            EntryType: entryType,
            Description: description,
            Entry: entry
        };
        //modal edit timehseet
        var options = new ModalWindowOptions();
        options.title = Resources.Timesheet.ApprovalEntry;
        options.closeButton = true;
        options.onClose = function () {
            //onClose callback
            self.approvalEntryModal = null;
            Utils.CleanNode($('#modal_approvalentry')[0]);
        };
        //btn approve
        var btnApprove = new ModalButton();
        btnApprove.label = Resources.Timesheet.Approve;
        btnApprove.loadingText = Resources.Timesheet.Approving;
        btnApprove.id = 'btnApproveTimesheetEntry';
        btnApprove.isPrimary = true;
        btnApprove.action = function (e) {
            self.ApproveTimesheetEntry(timesheetWeekDay, entry, true);
        };
        options.buttons.push(btnApprove);
        //btn disapprove
        var btnDisapprove = new ModalButton();
        btnDisapprove.label = Resources.Timesheet.Disapprove;
        btnDisapprove.loadingText = Resources.Timesheet.Disapproving;
        btnDisapprove.id = 'btnDisapproveTimesheetEntry';
        btnDisapprove.action = function (e) {
            self.ApproveTimesheetEntry(timesheetWeekDay, entry, false);
        };
        options.buttons.push(btnDisapprove);
        options.style = 'width: 700px;';
        UI.ShowModal(taskrow.templatePath + 'Timesheet/TimesheetApprovalEntry', {}, options, function (Modal) {
            self.approvalEntryModal = Modal;
            ko.applyBindings(entryViewModel, $('#modal_approvalentry')[0]);
            $(window).trigger('taskrow:modalbodyresized');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.ApproveTimesheetEntry = function (timesheetWeekDay, entry, approve) {
        var self = this;
        var $button = (approve) ? $('#btnApproveTimesheetEntry') : $('#btnDisapproveTimesheetEntry');
        taskrow.DisplayLoading();
        $button.button('loading');
        $.post('Timesheet/ApproveTimesheetEntry', { comment: entry.ApprovalComment(), timesheetentryid: entry.TimesheetEntryID, approve: approve }, function (data) {
            if (data.Success) {
                var newTimesheetWeekDay = data.Entity;
                var newTimesheetWeekDayModel = new TimesheetWeekDayPartialModel(newTimesheetWeekDay, self.ActionType, self.timesheetUser.UserID, self.UserRelationType);
                self.viewModel.ReplaceTimesheetDay(timesheetWeekDay, newTimesheetWeekDayModel);
                self.RefreshColumnsPosition();
                if (self.approvalEntryModal != null)
                    self.approvalEntryModal.close();
            }
            else {
                UI.Alert(data.Message);
            }
            $button.button('reset');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.ShowRequestTaskModal = function () {
        var self = this;
        taskrow.DisplayLoading();
        //modal edit timehseet
        var options = new ModalWindowOptions();
        options.title = Resources.Timesheet.RequestTask;
        options.closeButton = true;
        options.onClose = function () {
            //onClose callback
            self.requestTaskModal = null;
            self.requestTaskUserID = null;
        };
        //btn save
        var btnSave = new ModalButton();
        btnSave.label = Resources.Commons.Save;
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.id = 'btnSaveRequestTask';
        btnSave.isPrimary = true;
        btnSave.action = function (e) {
            self.RequestTask(self.requestTaskUserID, $('#txtRequestTask').val());
        };
        options.buttons.push(btnSave);
        options.style = 'width: 600px;';
        UI.ShowModal(taskrow.templatePath + 'Timesheet/TimesheetRequestTask', {}, options, function (Modal) {
            $('#toUserID').val('');
            $('#txtRequestTask').val('');
            self.requestTaskUserID = null;
            var searchToUser = new SearchUser({
                searchBox: $('#toUserSearchBox')[0],
                mode: SearchUserMode.Unique,
                renderUsers: false,
                initialUsers: [],
                placeholder: Resources.Task.Owner,
                clearAfterSelected: false,
                showUserIcon: false
            });
            searchToUser.selectUserCallback = function (user) {
                self.requestTaskUserID = user.UserID;
                $('#toUserMask img').attr('src', environmentData.userMask.SmallRelativeURL + user.UserHashCode + '.jpg');
                $('#toUserID').val(user.UserID);
            };
            searchToUser.Init();
            self.requestTaskModal = Modal;
            $(window).trigger('taskrow:modalbodyresized');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.RepeatPreviousDay = function (weekDay) {
        var self = this;
        //console.log(['weekDay', weekDay]);
        var weekDayIndex = _.indexOf(this.viewModel.TimesheetWeekDays(), weekDay);
        if ((weekDayIndex == 0 && !this.serverData.TimesheetWeek.WeekPreviousDayHasEntries) || (weekDayIndex > 0 && !this.viewModel.TimesheetWeekDays()[weekDayIndex - 1].HasEntries())) {
            UI.Alert(Resources.Timesheet.PreviousDayHasNoEntries);
            return false;
        }
        var _repeat = function () {
            taskrow.DisplayLoading();
            $.post('Timesheet/RepeatPreviousDay', { dayID: weekDay.DayID }, function (data) {
                taskrow.HideLoading();
                if (data.Success === false) {
                    UI.Alert(data.Message);
                    return;
                }
                var newTimesheetWeekDay = data.Entity;
                var newTimesheetWeekDayModel = new TimesheetWeekDayPartialModel(newTimesheetWeekDay, self.ActionType, self.timesheetUser.UserID, self.UserRelationType);
                self.viewModel.ReplaceTimesheetDay(weekDay, newTimesheetWeekDayModel);
                self.RefreshColumnsPosition();
                if (!newTimesheetWeekDay.HasEntries)
                    UI.Alert("Nenhum lançamento do dia anterior foi copiado. Certifique-se que existem lançamentos aptos a serem copiados");
                HeaderTimesheet.LoadTimesheetDayData();
            });
        };
        UI.ConfirmYesNo(Resources.Timesheet.ConfirmRepeatPreviousDay, function () {
            _repeat();
        });
    };
    Timesheet.prototype.RequestTask = function (toUserID, message) {
        var self = this;
        var errors = 0;
        if (!toUserID || toUserID == 0) {
            $('#ToUserError').remove();
            $('<span id="ToUserError" data-valmsg-replace="true" data-valmsg-for="toUserID" class="field-validation-error"><span for="toUserID" generated="true" class="">' + Resources.Timesheet.RequestTaskUserRequired + '</span></span>').insertAfter($('#toUserID'));
            errors++;
        }
        else {
            $('#ToUserError').remove();
        }
        if (!message || message.length == 0) {
            $('#txtRequestTaskError').remove();
            $('<span id="txtRequestTaskError" data-valmsg-replace="true" data-valmsg-for="txtRequestTask" class="field-validation-error"><span for="txtRequestTask" generated="true" class="">' + Resources.Timesheet.RequestTaskDescRequired + '</span></span>').insertAfter($('#txtRequestTask'));
            errors++;
        }
        else {
            $('#txtRequestTaskError').remove();
        }
        if (errors > 0) {
            $('#btnSaveRequestTask').removeAttr('disabled');
            return false;
        }
        taskrow.DisplayLoading();
        $('#btnSaveRequestTask').button('loading');
        $.post('Timesheet/RequestTimesheetTask', { toUserID: toUserID, message: message }, function (data) {
            if (data.Success) {
                if (self.requestTaskModal != null)
                    self.requestTaskModal.close();
                self.requestTaskUserID = null;
            }
            else {
                UI.Alert(data.Message);
            }
            $('#btnSaveRequestTask').button('reset');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.ToggleTimesheetScroll = function () {
        //timesheetWeekScroll
        var clicks = $(this).data('clicks');
        var $timesheetWeekScroll = $(".timesheetWeekScroll");
        if (clicks) {
            $($timesheetWeekScroll).scrollLeft(0);
        }
        else {
            var scrollLeft = $(".timesheetWeek", $timesheetWeekScroll).width() - $($timesheetWeekScroll).width();
            $(".timesheetWeekScroll").scrollLeft(scrollLeft);
        }
        $(this).data("clicks", !clicks);
    };
    Timesheet.prototype.MoveTimesheetWeek = function (weekOffset) {
        var weekindex = this.serverData.TimesheetWeek.Week.WeekIndex + weekOffset;
        this.ReloadTimesheetWeek(weekindex);
    };
    Timesheet.prototype.MoveToCurrentWeek = function () {
        if (this.serverData.TimesheetWeek.Week.WeekIndex != this.serverData.CurrentDayWeekIndex)
            this.ReloadTimesheetWeek(this.serverData.CurrentDayWeekIndex);
    };
    Timesheet.prototype.ReloadTimesheetWeek = function (weekindex) {
        var self = this;
        var timesheetUserID = self.timesheetUser.UserID;
        taskrow.DisplayLoading();
        $.get('Timesheet/AjaxTimesheet', { userid: timesheetUserID, weekindex: weekindex }, function (data) {
            self.serverData.TimesheetWeek = data.TimesheetWeek;
            self.serverData.TaskList = data.TaskList;
            self.viewModel.RefreshTimesheetWeek(data.TimesheetWeek, self.ActionType, self.timesheetUser.UserID);
            self.viewModel.Tasklist.RefreshData(self.serverData);
            self.RefreshColumnsPosition();
            taskrow.HideLoading();
            var page = (self.isEditMode) ? '#timesheet/' : '#timesheetapproval/';
            var isCurrentUser = (timesheetUserID != environmentData.currentUserID || window.location.hash.indexOf('/User/') > -1) ? 'User/' + timesheetUserID + '/' : '';
            if (window.location.hash != page + isCurrentUser + weekindex)
                window.location.href = page + isCurrentUser + weekindex;
        });
    };
    Timesheet.prototype.CurrentDayRefreshData = function (data, actionType, timesheetUserID, userRelationType) {
        var timesheetDay = _.find(this.serverData.TimesheetWeek.Days, function (x) { return x.DayID == data.DayID; });
        if (timesheetDay) {
            timesheetDay = data;
            var dayModel = _.find(this.viewModel.TimesheetWeekDays(), function (x) { return x.DayID == data.DayID; });
            if (dayModel)
                dayModel.RefreshTimesheetWeek(data, actionType, timesheetUserID, userRelationType);
        }
    };
    //#region Block Timesheet
    Timesheet.prototype.NewBlockTimesheet = function () {
        var blockTimesheet = {
            LongTermAbsenceID: 0,
            User: { UserID: environmentData.currentUserID },
            StartDate: null,
            EndDate: null,
            AbsenceTypeID: null,
            DailyMinutes: 0,
            MemoEntry: ''
        };
        this.ShowBlockTimesheetModal(blockTimesheet);
    };
    Timesheet.prototype.EditBlockTimesheet = function (entry) {
        var self = this;
        taskrow.DisplayLoading();
        $.get('Timesheet/GetBlockTimesheetDetail', { blockTimesheetID: entry.LongTermAbsenceID }, function (data) {
            taskrow.HideLoading();
            if (data.Success === false) {
                UI.Alert(data.Message);
                return;
            }
            var blockTimesheet = data.Entity;
            self.ShowBlockTimesheetModal(blockTimesheet);
        });
    };
    Timesheet.prototype.ShowBlockTimesheetModal = function (blockTimesheet) {
        var self = this;
        taskrow.DisplayLoading();
        var startDate = (blockTimesheet.StartDate != null) ? $M(blockTimesheet.StartDate).format(environmentData.RegionalSettings.MomentShortDateFormat) : null;
        var endDate = (blockTimesheet.EndDate != null) ? $M(blockTimesheet.EndDate).format(environmentData.RegionalSettings.MomentShortDateFormat) : null;
        var dailyMinutes = blockTimesheet.DailyMinutes;
        self.blockTimesheetViewModel = {
            AbsenceTypeID: ko.observable(blockTimesheet.AbsenceTypeID),
            LongTermAbsenceID: ko.observable(blockTimesheet.LongTermAbsenceID),
            DailyMinutes: ko.observable(dailyMinutes),
            UserID: ko.observable(blockTimesheet.User.UserID),
            StartDate: ko.observable(startDate),
            EndDate: ko.observable(endDate),
            MemoEntry: ko.observable(blockTimesheet.MemoEntry || ''),
            AbsenceTypeList: ko.observableArray(this.serverData.AbsenceTypeListBlockTimesheet)
        };
        //modal edit timehseet
        var options = new ModalWindowOptions();
        options.title = Resources.Timesheet.BlockTimesheetTitle;
        options.closeButton = true;
        options.onClose = function () {
            //onClose callback
            if (self.blockTimesheetStartDatepicker) {
                self.blockTimesheetStartDatepicker.datepicker('remove');
                self.blockTimesheetStartDatepicker = null;
            }
            if (self.blockTimesheetEndDatepicker) {
                self.blockTimesheetEndDatepicker.datepicker('remove');
                self.blockTimesheetEndDatepicker = null;
            }
            self.blockTimesheetViewModel = null;
            Utils.CleanNode(self.blockTimesheetModal.element);
            self.blockTimesheetModal = null;
        };
        if (blockTimesheet.LongTermAbsenceID > 0) {
            var btnDelete = new ModalButton();
            btnDelete.label = Resources.Commons.Delete;
            btnDelete.loadingText = Resources.Commons.Excluding;
            btnDelete.id = "btnDeleteBlockTimesheet";
            btnDelete.action = function (e) {
                self.DeleteBlockTimesheet(blockTimesheet.LongTermAbsenceID, function () {
                    self.ReloadTimesheetWeek(self.serverData.TimesheetWeek.Week.WeekIndex);
                    HeaderTimesheet.LoadTimesheetDayData();
                    self.blockTimesheetModal.close();
                });
            };
            options.buttons.push(btnDelete);
        }
        //btn save
        var btnSave = new ModalButton();
        btnSave.label = Resources.Commons.Save;
        btnSave.loadingText = Resources.Commons.Saving;
        btnSave.id = 'btnSaveBlockTimesheet';
        btnSave.isPrimary = true;
        btnSave.action = function (e) {
            var validPeriod = self.BlockTimesheetPeriodValidate();
            if (!$('#frmSaveBlockTimesheet').valid() || !validPeriod) {
                $('#btnSaveBlockTimesheet').removeAttr('disabled');
                return false;
            }
            taskrow.DisplayLoading();
            $('#btnSaveBlockTimesheet').button('loading');
            $('#frmSaveBlockTimesheet').submit();
        };
        options.buttons.push(btnSave);
        options.style = 'width: 650px;';
        UI.ShowModal(taskrow.templatePath + 'Timesheet/BlockTimesheetDetail', {}, options, function (Modal) {
            self.blockTimesheetModal = Modal;
            ko.applyBindings(self.blockTimesheetViewModel, self.blockTimesheetModal.element);
            self.LoadBlockTimesheetComponents();
            Utils.SetupValidation($('#frmSaveBlockTimesheet')[0]);
            $(window).trigger('taskrow:modalbodyresized');
            taskrow.HideLoading();
        });
    };
    Timesheet.prototype.LoadBlockTimesheetComponents = function () {
        var self = this;
        if (!this.blockTimesheetStartDatepicker)
            self.SetupBlockTimesheetStartDatepicker();
        if (!this.blockTimesheetEndDatepicker)
            self.SetupBlockTimesheetEndDatepicker();
    };
    Timesheet.prototype.SetupBlockTimesheetStartDatepicker = function () {
        var self = this;
        this.blockTimesheetStartDatepicker = $('#modal_blocktimesheet #StartDate').datepicker({
            format: environmentData.RegionalSettings.MomentShortDateFormat.toLowerCase(),
            autoclose: true
        }).off('changeDate').on('changeDate', function (ev) {
            $('#frmSaveBlockTimesheet')[0].validator.element('#StartDate');
            self.BlockTimesheetPeriodValidate();
        });
    };
    Timesheet.prototype.SetupBlockTimesheetEndDatepicker = function () {
        var self = this;
        this.blockTimesheetEndDatepicker = $('#modal_blocktimesheet #EndDate').datepicker({
            format: environmentData.RegionalSettings.MomentShortDateFormat.toLowerCase(),
            autoclose: true
        }).off('changeDate').on('changeDate', function (ev) {
            $('#frmSaveBlockTimesheet')[0].validator.element('#EndDate');
            self.BlockTimesheetPeriodValidate();
        });
    };
    Timesheet.prototype.BlockTimesheetPeriodValidate = function () {
        if ($('#modal_blocktimesheet #StartDate').val().length == 0 || $('#modal_blocktimesheet #EndDate').val().length == 0) {
            $('#blocktimesheetInvalidPeriod').hide();
            return true;
        }
        var endDate = $M(this.blockTimesheetEndDatepicker.data('datepicker').getDate(), true);
        var startDate = $M(this.blockTimesheetStartDatepicker.data('datepicker').getDate(), true);
        if (endDate.diff(startDate, 'days') < 0) {
            $('#blocktimesheetInvalidPeriod').show();
            return false;
        }
        else {
            $('#blocktimesheetInvalidPeriod').hide();
            return true;
        }
    };
    Timesheet.prototype.SaveBlockTimesheet_OnComplete = function (response) {
        $('#btnSaveBlockTimesheet').button('reset');
        if (response.status != 200) {
            UI.Alert(Resources.Timesheet.BlockTimesheetErrorOnSave);
            return;
        }
        var data = JSON.parse(response.responseText);
        if (data.Success === false) {
            taskrow.HideLoading();
            UI.Alert(data.Message);
            return false;
        }
        var notInclude = data.Entity.NotInclude;
        if (notInclude && notInclude.length > 0) {
            UI.Alert(Resources.Absence.LongterNotIncludeDays + '<br/> -' + notInclude.join('<br/>-'));
        }
        var longtermData = data.Entity.LongTermAbsence;
        var weekStartDate = $M(taskrow.currentModule.serverData.TimesheetWeek.Week.StartDate);
        var weekEndDate = $M(taskrow.currentModule.serverData.TimesheetWeek.Week.EndDate);
        if ($M(longtermData.StartDate).diff(weekEndDate, 'days') <= 0 && $M(longtermData.EndDate).diff(weekStartDate, 'days') >= 0) {
            taskrow.currentModule.ReloadTimesheetWeek(taskrow.currentModule.serverData.TimesheetWeek.Week.WeekIndex);
        }
        HeaderTimesheet.LoadTimesheetDayData();
        taskrow.HideLoading();
        taskrow.currentModule.blockTimesheetModal.close();
    };
    Timesheet.prototype.DeleteBlockTimesheet = function (blockTimesheetID, successCallback) {
        var self = this;
        UI.ConfirmYesNo('Deseja realmente excluir esse período de bloqueio de timesheet?', function () {
            taskrow.DisplayLoading();
            $.ajax({
                url: 'Timesheet/DeleteBlockTimesheet',
                data: { blockTimesheetID: blockTimesheetID },
                success: function (data) {
                    taskrow.HideLoading();
                    if (data.Success === false) {
                        taskrow.HideLoading();
                        UI.Alert(data.Message);
                        return;
                    }
                    if (successCallback)
                        successCallback();
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    taskrow.HideLoading();
                    if (console)
                        console.error(textStatus);
                }
            });
        });
    };
    //#endregion
    Timesheet.prototype.ToggleExpandDays = function () {
        this.viewModel.ForceExpandedAllDays(!this.viewModel.ForceExpandedAllDays());
        var collapse = !this.viewModel.ForceExpandedAllDays();
        _.each(this.viewModel.TimesheetWeekDays(), function (day) {
            if (collapse)
                day.Collapsed(true);
            else
                day.Collapsed(day.IsWeekend());
        });
    };
    Timesheet.prototype.CollapseDay = function (day) {
        day.Collapsed(!day.Collapsed());
        if (this.viewModel.ForceExpandedAllDays()) {
            var hasCollapsedDay = _.any(this.viewModel.TimesheetWeekDays(), function (day) { return day.Collapsed(); });
            if (hasCollapsedDay)
                this.viewModel.ForceExpandedAllDays(false);
        }
    };
    return Timesheet;
}());
var TimesheetViewModel = /** @class */ (function () {
    function TimesheetViewModel(data) {
        var self = this;
        this.SelectedTab = ko.observable(EnumTimesheetTab.Timesheet);
        this.CurrentDay = data.CurrentDay;
        this.ActionType = data.ActionType;
        this.AbsenceType = ko.observableArray(_.sortBy(data.AbsenceTypeList, function (x) { return x.Description; }));
        this.TimesheetWeek = ko.observable(data.TimesheetWeek.Week);
        this.WeekPreviousDayHasEntries = ko.observable(data.TimesheetWeek.WeekPreviousDayHasEntries);
        this.Groups = new DataSource([]);
        this.TimesheetWeekDays = ko.observableArray([]);
        this.TimesheetUser = ko.observable(data.User);
        data.TimesheetWeek.Days.forEach(function (day, i) {
            var newItem = new TimesheetWeekDayPartialModel(day, data.ActionType, data.User.UserID, data.TimesheetWeek.UserRelationType);
            self.TimesheetWeekDays.push(newItem);
            self.SetupTimesheetWeekDayPartialModelEvents(newItem);
        });
        this.WeekLabel = ko.computed(function () {
            if (self.TimesheetWeekDays() && self.TimesheetWeekDays().length > 0)
                return $M(self.TimesheetWeekDays()[0].Date, true).format(environmentData.RegionalSettings.MomentShortestDateFormat) +
                    ' ' + Resources.Commons.Until.toLowerCase() +
                    ' ' + $M(self.TimesheetWeekDays()[self.TimesheetWeekDays().length - 1].Date, true).format(environmentData.RegionalSettings.MomentShortestDateFormat);
            return Resources.Timesheet.Week;
        });
        this.Tasklist = new TasklistPartialModel(data);
        this.Tasklist.Filters.FilterSettings.FilterClient.subscribe(function () {
            $(window).trigger('resize');
        });
        this.Tasklist.Filters.FilterSettings.FilterJob.subscribe(function () {
            $(window).trigger('resize');
        });
        this.MinutesRemainingDayReference = ko.observable(0);
        this.TotalMinutesDayReference = ko.observable(0);
        this.SelectedGroup = ko.observable(null);
        this.WeeksPendingTimesheet = ko.observableArray(data.WeeksPendingTimesheet);
        this.CurrentUserHasDailyMinutesLimit = ko.observable(data.CurrentUserHasDailyMinutesLimit || false);
        this.OvertimeAuthorizationEnabled = ko.computed(function () {
            var timesheetUser = this.TimesheetUser();
            return (timesheetUser && timesheetUser.UserID == environmentData.currentUserID);
        }, this);
        this.ExpandedDays = ko.computed(function () {
            return _.filter(this.TimesheetWeekDays(), function (day) { return !day.Collapsed(); }).length;
        }, this);
        this.CollapsedDays = ko.computed(function () {
            return _.filter(this.TimesheetWeekDays(), function (day) { return day.Collapsed(); }).length;
        }, this);
        this.dummyCalcColumnWidth = ko.observable();
        this.ExpandedDayWidth = ko.computed(function () {
            this.dummyCalcColumnWidth();
            var collapsedDays = this.CollapsedDays();
            var expandedDays = this.ExpandedDays();
            var boardWidth = $('#timesheetBoard').outerWidth();
            var widthAvailable = boardWidth - (collapsedDays * 55);
            var width = widthAvailable / expandedDays;
            return width;
        }, this);
        this.FilterClients = ko.observableArray([]);
        this.RefreshFilters();
        this.ForceExpandedAllDays = ko.observable(true);
    }
    TimesheetViewModel.prototype.RefreshGroupsData = function (data) {
        var self = this;
        this.Groups.RefreshData(data);
        this.Groups.RecursionProperty = 'Groups';
        var timesheetUserID = self.TimesheetUser().UserID;
        var _isUserGroup = function (group) {
            var index = _.indexOf(_.pluck(group.Members, 'UserID'), timesheetUserID);
            return index > -1;
        };
        var _findUserGroup = function (group) {
            if (_isUserGroup(group)) {
                return group;
            }
            else if (group.Groups.length > 0) {
                var selectedGroup = null;
                $.each(group.Groups, function (i, g) {
                    selectedGroup = _findUserGroup(g);
                    if (selectedGroup != null) {
                        return false;
                    }
                });
                return selectedGroup;
            }
        };
        this.SelectedGroup(_findUserGroup(data[0]));
    };
    TimesheetViewModel.prototype.ReplaceTimesheetDay = function (oldTimesheetWeekDay, newTimesheetWeekDayDataModel) {
        //this.SetupTimesheetWeekDayPartialModelEvents(newTimesheetWeekDay);
        var index = this.TimesheetWeekDays.indexOf(oldTimesheetWeekDay);
        this.TimesheetWeekDays.replace(oldTimesheetWeekDay, newTimesheetWeekDayDataModel);
        this.RefreshFilters();
    };
    TimesheetViewModel.prototype.RefreshTimesheetWeek = function (data, actionType, timesheetUserID) {
        var self = this;
        this.TimesheetWeek(data.Week);
        this.WeekPreviousDayHasEntries(data.WeekPreviousDayHasEntries);
        self.TimesheetWeekDays([]);
        this.ForceExpandedAllDays(true);
        data.Days.forEach(function (day, i) {
            var newDay = new TimesheetWeekDayPartialModel(day, actionType, timesheetUserID, data.UserRelationType);
            self.TimesheetWeekDays.push(newDay);
            self.SetupTimesheetWeekDayPartialModelEvents(newDay);
        });
        this.RefreshFilters();
    };
    TimesheetViewModel.prototype.SetupTimesheetWeekDayPartialModelEvents = function (model) {
        $(model).bind('taskrow:sendtoapproval', (function (e, data) { $(this).trigger('taskrow:sendtoapproval', data); }).bind(this));
        $(model).bind('taskrow:sendtoedit', (function (e, data) { $(this).trigger('taskrow:sendtoedit', data); }).bind(this));
        $(model).bind('taskrow:approvetimesheetday', (function (e, data) { $(this).trigger('taskrow:approvetimesheetday', data); }).bind(this));
        $(model).bind('taskrow:disapprovetimesheetday', (function (e, data) { $(this).trigger('taskrow:disapprovetimesheetday', data); }).bind(this));
    };
    TimesheetViewModel.prototype.SetupEvents = function (onSendToApproval, onSendToEdit, onApprove, onDisapprove) {
        $(this).bind('taskrow:sendtoapproval', function (e, data) { onSendToApproval(data); });
        $(this).bind('taskrow:sendtoedit', function (e, data) { onSendToEdit(data); });
        $(this).bind('taskrow:approvetimesheetday', function (e, data) { onApprove(data); });
        $(this).bind('taskrow:disapprovetimesheetday', function (e, data) { onDisapprove(data); });
    };
    TimesheetViewModel.prototype.ClearClientFilters = function () {
        _.each(this.FilterClients(), function (c) { return c.Selected(false); });
    };
    TimesheetViewModel.prototype.RefreshFilters = function () {
        var previousSelectedClients = _.pluck(_.filter(this.FilterClients(), function (x) { return x.Selected(); }), 'ClientID');
        this.FilterClients.removeAll();
        var clients = [];
        _.each(this.TimesheetWeekDays(), function (day) {
            _.each(day.Entries(), function (entry) {
                var availableEntry = (entry.MinutesSpent() > 0 || entry.ModificationDate() == entry.CreationDate() || entry.EntryStatusID == TimesheetEntryStatus.Disapproved);
                if (entry.ClientID() > 0 && availableEntry) {
                    var existingClient = _.filter(clients, function (c) { return c.ClientID == entry.ClientID(); })[0];
                    if (existingClient)
                        existingClient.TotalMinutes(existingClient.TotalMinutes() + entry.MinutesSpent());
                    else {
                        var previouslySelected = _.contains(previousSelectedClients, entry.ClientID());
                        clients.push({
                            ClientID: entry.ClientID(),
                            ClientDisplayName: entry.ClientDisplayName,
                            TotalMinutes: ko.observable(entry.MinutesSpent()),
                            Selected: ko.observable(previouslySelected)
                        });
                    }
                }
            });
            _.each(day.JobEntries(), function (entry) {
                var availableEntry = (entry.MinutesSpent() > 0 || entry.ModificationDate() == entry.CreationDate() || entry.EntryStatusID == TimesheetEntryStatus.Disapproved);
                if (entry.ClientID() > 0 && availableEntry) {
                    var existingClient = _.filter(clients, function (c) { return c.ClientID == entry.ClientID(); })[0];
                    if (existingClient)
                        existingClient.TotalMinutes(existingClient.TotalMinutes() + entry.MinutesSpent());
                    else {
                        var previouslySelected = _.contains(previousSelectedClients, entry.ClientID());
                        clients.push({
                            ClientID: entry.ClientID(),
                            ClientDisplayName: entry.ClientDisplayName,
                            TotalMinutes: ko.observable(entry.MinutesSpent()),
                            Selected: ko.observable(previouslySelected)
                        });
                    }
                }
            });
        });
        _.each(clients, function (client) {
            client['Selected'].subscribe(function (selected) {
                this.RefreshSelectedClients();
            }.bind(this));
        }, this);
        clients = clients.sort(function (a, b) {
            if (a.TotalMinutes() > b.TotalMinutes())
                return -1;
            else if (a.TotalMinutes() < b.TotalMinutes())
                return 1;
            else if (a.TotalMinutes() == b.TotalMinutes())
                return Utils.Compare(a.ClientDisplayName, b.ClientDisplayName);
        });
        this.FilterClients(clients);
    };
    TimesheetViewModel.prototype.RefreshSelectedClients = function () {
        var selectedClientIDs = _.pluck(_.filter(this.FilterClients(), function (x) { return x.Selected(); }), 'ClientID');
        var clientsToFilter = selectedClientIDs.length > 0;
        _.each(this.TimesheetWeekDays(), function (day) {
            _.each(day.Entries(), function (entry) {
                var fadeOff = clientsToFilter && !_.contains(selectedClientIDs, entry.ClientID());
                entry.FadeOff(fadeOff);
            });
            _.each(day.JobEntries(), function (entry) {
                var fadeOff = clientsToFilter && !_.contains(selectedClientIDs, entry.ClientID());
                entry.FadeOff(fadeOff);
            });
            _.each(day.Absences(), function (entry) { entry.FadeOff(clientsToFilter); });
            _.each(day.UnallocatedTime(), function (entry) { entry.FadeOff(clientsToFilter); });
        });
    };
    return TimesheetViewModel;
}());
var TimesheetWeekDayPartialModel = /** @class */ (function () {
    function TimesheetWeekDayPartialModel(data, actionType, timesheetUserID, userRelationType) {
        //console.log('TimesheetWeekDayPartialModel');
        var self = this;
        this.ActionType = actionType;
        this.TimesheetUserID = timesheetUserID;
        this.Date = data.Date;
        this.DayID = data.DayID;
        this.DailyMinutes = ko.observable(data.DailyMinutes);
        this.DayLabel = data.DayLabel;
        this.DayStatusID = ko.observable(data.DayStatusID);
        this.DayLocked = ko.observable(data.DayLocked);
        this.TimesheetDayStatusType = ko.observable(data.TimesheetDayStatusType);
        this.ViewApprovedTimesheetPermission = ko.observable(data.ViewApprovedTimesheetPermission);
        this.MonthLabel = data.MonthLabel;
        this.NotProvidedTime = data.NotProvidedTime;
        this.RowVersion = data.RowVersion;
        this.TimesheetDayID = data.TimesheetDayID;
        this.TypeCalendarDayID = data.TypeCalendarDayID;
        this.Weekindex = data.Weekindex;
        this.TotalTime = ko.observable(data.TotalTime);
        this.HasEntries = ko.observable(data.HasEntries);
        //verifica se usuario possui relação empresa com menos minutos diários
        if (userRelationType && userRelationType.DailyMinutes > 0 && userRelationType.DailyMinutes < this.DailyMinutes())
            this.DailyMinutes(userRelationType.DailyMinutes);
        this.TotalTimeFormat = ko.computed(function () {
            return Utils.FormatMinutes(self.TotalTime());
        });
        this.Entries = ko.observableArray([]);
        if (data.Entries && data.Entries.length > 0) {
            data.Entries.forEach(function (entry, i) {
                self.Entries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        this.TasklistEntries = ko.observableArray([]);
        if (data.TasklistEntries && data.TasklistEntries.length > 0) {
            data.TasklistEntries.forEach(function (entry, i) {
                self.TasklistEntries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        this.Absences = ko.observableArray([]);
        if (data.Absences && data.Absences.length > 0) {
            data.Absences.forEach(function (entry, i) {
                self.Absences.push(new TimesheetEntryPartialModel(entry));
            });
        }
        this.UnallocatedTime = ko.observableArray([]);
        if (data.UnallocatedTime && data.UnallocatedTime.length > 0) {
            data.UnallocatedTime.forEach(function (entry, i) {
                self.UnallocatedTime.push(new TimesheetEntryPartialModel(entry));
            });
        }
        this.JobEntries = ko.observableArray([]);
        if (data.JobEntries && data.JobEntries.length > 0) {
            data.JobEntries.forEach(function (entry, i) {
                self.JobEntries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        this.RecentJobEntries = ko.observableArray([]);
        if (data.RecentJobEntries && data.RecentJobEntries.length > 0) {
            data.RecentJobEntries.forEach(function (entry, i) {
                if (_.any(self.JobEntries(), function (x) { return x.JobNumber == entry.JobNumber && x.MinutesSpent() > 0; }))
                    return;
                self.RecentJobEntries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        this.DayCompleted = ko.computed(function () {
            if (self.DailyMinutes() == 0)
                return (self.Entries().length > 0 || self.Absences().length > 0 || self.UnallocatedTime().length > 0 || self.JobEntries().length > 0);
            else
                return (self.TotalTime() >= self.DailyMinutes());
        });
        this.MinutesRemaining = ko.computed(function () {
            var dailyMinutes = self.DailyMinutes();
            var totalTime = self.TotalTime();
            return Math.max(0, dailyMinutes - totalTime);
        });
        this.ActionButton = ko.computed(function () {
            var butonId = '';
            var labelbt = '';
            var loadingLabel = '';
            var isbutton = false;
            var cssClass = '';
            var actionurl = $.noop;
            var isdropdownbutton = false;
            var butonId2 = '';
            var actionurl2 = $.noop;
            var labelbt2 = '';
            var loadingLabel2 = '';
            var includeSecondaryAction = false;
            var secondaryBtnId = '';
            var secondaryAction = $.noop;
            var secondaryLabel = '';
            var secondaryLoadingLabel = '';
            var isMyTimesheet = (self.TimesheetUserID == environmentData.currentUserID);
            var dayStatusType = self.TimesheetDayStatusType();
            switch (dayStatusType) {
                case EnumTimesheetDayStatusType.Locked:
                    labelbt = Resources.Timesheet.Locked;
                    isbutton = false;
                    cssClass = 'revisar';
                    break;
                case EnumTimesheetDayStatusType.NotRequired:
                    labelbt = Resources.Timesheet.NotRequired;
                    isbutton = false;
                    cssClass = 'nao-obrigatorio';
                    break;
                case EnumTimesheetDayStatusType.Editing:
                    labelbt = (self.ActionType == TimesheetActionType.Edit && isMyTimesheet) ? Resources.Timesheet.Edit : Resources.Timesheet.Editing;
                    isbutton = false;
                    cssClass = 'em-preenchimento';
                    break;
                case EnumTimesheetDayStatusType.Completed:
                    if (self.ActionType == TimesheetActionType.Edit && isMyTimesheet) {
                        butonId = 'btnSendToApproval' + self.DayID;
                        labelbt = Resources.Timesheet.SendToApproval;
                        loadingLabel = Resources.Commons.Sending;
                        isbutton = true;
                        actionurl = this.OnSendToApproval;
                        cssClass = 'enviar';
                    }
                    else {
                        labelbt = Resources.Timesheet.Editing;
                        isbutton = false;
                        cssClass = 'em-preenchimento';
                    }
                    break;
                case EnumTimesheetDayStatusType.Approved:
                    labelbt = Resources.Timesheet.Approved;
                    isbutton = false;
                    cssClass = 'aprovado';
                    if (self.ActionType == TimesheetActionType.Approval && !isMyTimesheet) {
                        includeSecondaryAction = true;
                        secondaryBtnId = 'btnDisapprove' + self.DayID;
                        secondaryAction = this.OnDisapproveTimesheetDay;
                        secondaryLabel = Resources.Timesheet.DisapproveDay;
                        secondaryLoadingLabel = Resources.Timesheet.Disapproving;
                    }
                    break;
                case EnumTimesheetDayStatusType.Approval:
                    if (self.ActionType == TimesheetActionType.Approval && !isMyTimesheet) {
                        butonId = 'btnApprove' + self.DayID;
                        labelbt = Resources.Timesheet.ApproveDay;
                        loadingLabel = Resources.Timesheet.Approving;
                        isbutton = true;
                        actionurl = this.OnApproveTimesheetDay;
                        cssClass = 'aprovar';
                        isdropdownbutton = true;
                        butonId2 = 'btnDisapprove' + self.DayID;
                        actionurl2 = this.OnDisapproveTimesheetDay;
                        labelbt2 = Resources.Timesheet.DisapproveDay;
                        loadingLabel2 = Resources.Timesheet.Disapproving;
                    }
                    else {
                        labelbt = Resources.Timesheet.ForApproval;
                        isbutton = false;
                        cssClass = 'em-aprovacao';
                    }
                    break;
                case EnumTimesheetDayStatusType.ReviewDisapproved:
                    labelbt = (self.ActionType == TimesheetActionType.Edit && isMyTimesheet) ? Resources.Timesheet.Review : Resources.Timesheet.Reviewing;
                    isbutton = false;
                    cssClass = 'revisar';
                    break;
                case EnumTimesheetDayStatusType.Disapproved:
                    if (self.ActionType == TimesheetActionType.Approval && !isMyTimesheet) {
                        butonId = 'btnSendToEdit' + self.DayID;
                        labelbt = Resources.Timesheet.SendToEdit;
                        loadingLabel = Resources.Commons.Sending;
                        isbutton = true;
                        actionurl = this.OnSendToEdit;
                        cssClass = 'devolver';
                    }
                    else {
                        labelbt = Resources.Timesheet.ForApproval;
                        isbutton = false;
                        cssClass = 'em-aprovacao';
                    }
                    break;
            }
            actionurl = actionurl || function () { console.log('nothing 1'); };
            actionurl2 = actionurl2 || function () { console.log('nothing 2'); };
            var actionButton = {
                Status: dayStatusType,
                Label: labelbt,
                LoadingLabel: loadingLabel,
                IsButton: isbutton,
                ButtonId: butonId,
                Action: actionurl,
                CssClass: cssClass,
                IsDropDownButton: isdropdownbutton,
                ButtonId2: butonId2,
                Action2: actionurl2,
                Label2: labelbt2,
                LoadingLabel2: loadingLabel2,
                IncludeSecondaryAction: includeSecondaryAction,
                SecondaryBtnId: secondaryBtnId,
                SecondaryAction: secondaryAction,
                SecondaryLabel: secondaryLabel,
                SecondaryLoadingLabel: secondaryLoadingLabel
            };
            //console.log(['isMyTimesheet', isMyTimesheet, 'self.ActionType', self.ActionType, 'actionButton', actionButton]);
            return actionButton;
        }, this);
        this.HasTaskEntries = ko.computed(function () {
            return (this.Entries().length > 0 || this.TasklistEntries().length > 0);
        }, this);
        this.HasJobEntries = ko.computed(function () {
            return (this.JobEntries().length > 0 || this.RecentJobEntries().length > 0);
        }, this);
        this.HasAbsenceEntries = ko.computed(function () {
            return (this.Absences().length > 0 || this.UnallocatedTime().length > 0);
        }, this);
        this.HeaderTimesheetShowFilter = ko.computed(function () {
            return (this.HasTaskEntries() && this.HasJobEntries()) || (this.HasTaskEntries() && this.HasAbsenceEntries()) || (this.HasAbsenceEntries() && this.HasJobEntries());
        }, this);
        this.HeaderTimesheetFilterEntryType = ko.observable(null);
        if (data.LastTimesheetEntryType)
            this.RefreshHeaderTimesheetFilterEntryType(data.LastTimesheetEntryType);
        this.JobEntryTypeList = ko.observableArray(data.JobEntryTypeList || []);
        this.AbsenceTypeList = ko.observableArray(data.AbsenceTypeList || []);
        this.NeedJobEntryType = ko.computed(function () {
            if (this.JobEntryTypeList().length == 1)
                return false;
            return true;
        }, this);
        this.IsWeekend = ko.computed(function () {
            var weekday = $M(this.Date, true).weekday();
            return weekday == 0 || weekday == 6;
        }, this);
        this.DayCssClass = ko.observable('');
        this.Collapsed = ko.observable(this.IsWeekend());
        this.RefreshDayStatus();
    }
    TimesheetWeekDayPartialModel.prototype.RefreshTimesheetWeek = function (data, actionType, timesheetUserID, userRelationType) {
        this.ActionType = actionType;
        this.TimesheetUserID = timesheetUserID;
        this.Date = data.Date;
        this.DailyMinutes(data.DailyMinutes);
        this.DayID = data.DayID;
        this.DayLabel = data.DayLabel;
        this.DayStatusID(data.DayStatusID);
        this.DayLocked(data.DayLocked);
        this.TimesheetDayStatusType(data.TimesheetDayStatusType);
        this.ViewApprovedTimesheetPermission(data.ViewApprovedTimesheetPermission);
        this.MonthLabel = data.MonthLabel;
        this.NotProvidedTime = data.NotProvidedTime;
        this.RowVersion = data.RowVersion;
        this.TimesheetDayID = data.TimesheetDayID;
        this.TypeCalendarDayID = data.TypeCalendarDayID;
        this.Weekindex = data.Weekindex;
        this.TotalTime(data.TotalTime);
        this.HasEntries(data.HasEntries);
        //verifica se usuario possui relação empresa com menos minutos diários
        if (userRelationType && userRelationType.DailyMinutes > 0 && userRelationType.DailyMinutes < this.DailyMinutes())
            this.DailyMinutes(userRelationType.DailyMinutes);
        //console.log(['this.DailyMinutes', this.DailyMinutes(), 'this.TotalTime', this.TotalTime(), 'this.MinutesRemaining', this.MinutesRemaining()]);
        var self = this;
        self.Entries([]);
        if (data.Entries && data.Entries.length > 0) {
            data.Entries.forEach(function (entry, i) {
                self.Entries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        self.TasklistEntries([]);
        if (data.TasklistEntries && data.TasklistEntries.length > 0) {
            data.TasklistEntries.forEach(function (entry, i) {
                self.TasklistEntries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        self.Absences([]);
        if (data.Absences && data.Absences.length > 0) {
            data.Absences.forEach(function (entry, i) {
                self.Absences.push(new TimesheetEntryPartialModel(entry));
            });
        }
        self.UnallocatedTime([]);
        if (data.UnallocatedTime && data.UnallocatedTime.length > 0) {
            data.UnallocatedTime.forEach(function (entry, i) {
                self.UnallocatedTime.push(new TimesheetEntryPartialModel(entry));
            });
        }
        self.JobEntries([]);
        if (data.JobEntries && data.JobEntries.length > 0) {
            data.JobEntries.forEach(function (entry, i) {
                self.JobEntries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        self.RecentJobEntries([]);
        if (data.RecentJobEntries && data.RecentJobEntries.length > 0) {
            var defaulJobEntryTypeID = null;
            if (this.JobEntryTypeList().length == 1)
                defaulJobEntryTypeID = this.JobEntryTypeList()[0].JobEntryTypeID;
            data.RecentJobEntries.forEach(function (entry, i) {
                if (_.any(self.JobEntries(), function (x) { return x.JobNumber == entry.JobNumber && x.MinutesSpent() > 0; }))
                    return;
                entry.JobEntryTypeID = defaulJobEntryTypeID;
                self.RecentJobEntries.push(new TimesheetEntryPartialModel(entry));
            });
        }
        //force reload ActionButton
        this.TimesheetDayStatusType.valueHasMutated();
        if (data.LastTimesheetEntryType)
            this.RefreshHeaderTimesheetFilterEntryType(data.LastTimesheetEntryType);
    };
    TimesheetWeekDayPartialModel.prototype.RefreshHeaderTimesheetFilterEntryType = function (filterEntryType) {
        var newFilterEntryType = null;
        if (filterEntryType == TimesheetEntryType.Task && this.HasTaskEntries())
            newFilterEntryType = 1;
        else if (filterEntryType == TimesheetEntryType.Job && this.HasJobEntries())
            newFilterEntryType = 2;
        else if ((filterEntryType == TimesheetEntryType.Absence || filterEntryType == TimesheetEntryType.Unallocated) && this.HasAbsenceEntries())
            newFilterEntryType = 3;
        //se nao tiver um padrao, testa se possui apenas um dos tipos disponiveis
        if (!newFilterEntryType) {
            if (this.HasTaskEntries() && !this.HasJobEntries() && !this.HasAbsenceEntries())
                newFilterEntryType = 1;
            else if (this.HasJobEntries() && !this.HasTaskEntries() && !this.HasAbsenceEntries())
                newFilterEntryType = 2;
            else if (this.HasAbsenceEntries() && !this.HasTaskEntries() && !this.HasJobEntries())
                newFilterEntryType = 3;
        }
        this.HeaderTimesheetFilterEntryType(newFilterEntryType);
    };
    TimesheetWeekDayPartialModel.prototype.OnSendToApproval = function (timesheetWeekDay) {
        $(this).trigger('taskrow:sendtoapproval', timesheetWeekDay);
        //console.log('OnSendToApproval', arguments);
    };
    TimesheetWeekDayPartialModel.prototype.OnSendToEdit = function (timesheetWeekDay) {
        $(this).trigger('taskrow:sendtoedit', timesheetWeekDay);
        //console.log('OnSendToEdit', arguments);
    };
    TimesheetWeekDayPartialModel.prototype.OnApproveTimesheetDay = function (timesheetWeekDay) {
        $(this).trigger('taskrow:approvetimesheetday', timesheetWeekDay);
        //console.log('OnApproveTimesheetDay', arguments);
    };
    TimesheetWeekDayPartialModel.prototype.OnDisapproveTimesheetDay = function (timesheetWeekDay) {
        $(this).trigger('taskrow:disapprovetimesheetday', timesheetWeekDay);
        //console.log('OnApproveTimesheetDay', arguments);
    };
    TimesheetWeekDayPartialModel.prototype.RefreshDayStatus = function () {
        var collapsed = false;
        var actionType = this.ActionType;
        var date = $M(this.Date, true);
        var status = this.TimesheetDayStatusType();
        var hasEntries = this.HasTaskEntries() || this.HasJobEntries() || this.HasAbsenceEntries();
        var dayCss = '';
        var borderGray = 'border-color0';
        var borderYellow = 'border-color16';
        var borderBlue = 'border-color8';
        var borderRed = 'border-color12';
        var borderGreen = 'border-color24';
        if (status == EnumTimesheetDayStatusType.Approval) {
            dayCss = borderBlue;
            if (actionType == TimesheetActionType.Edit)
                collapsed = true;
        }
        else if (status == EnumTimesheetDayStatusType.Approved) {
            dayCss = borderGreen;
            collapsed = true;
        }
        else if (status == EnumTimesheetDayStatusType.Completed) {
            dayCss = borderYellow;
            if (actionType == TimesheetActionType.Approval)
                collapsed = true;
        }
        else if (status == EnumTimesheetDayStatusType.Disapproved) {
            dayCss = borderRed;
            if (actionType == TimesheetActionType.Approval)
                collapsed = true;
        }
        else if (status == EnumTimesheetDayStatusType.Editing) {
            dayCss = borderYellow;
            if (actionType == TimesheetActionType.Approval)
                collapsed = true;
        }
        else if (status == EnumTimesheetDayStatusType.Locked) {
            dayCss = borderGray;
            collapsed = true;
        }
        else if (status == EnumTimesheetDayStatusType.NotRequired) {
            if (!hasEntries)
                collapsed = true;
        }
        else if (status == EnumTimesheetDayStatusType.ReviewDisapproved) {
            dayCss = borderRed;
            if (actionType == TimesheetActionType.Approval)
                collapsed = true;
        }
        //sempre deixar aberto o dia atual
        if (date.diff($M(null, true), 'd') == 0)
            collapsed = false;
        this.DayCssClass(dayCss);
        //this.Collapsed(collapsed);
    };
    return TimesheetWeekDayPartialModel;
}());
var TimesheetEntryPartialModel = /** @class */ (function () {
    function TimesheetEntryPartialModel(data) {
        var self = this;
        this.ApprovalComment = ko.observable('');
        this.TaskID = data.TaskID;
        this.TaskTitle = data.TaskTitle;
        this.TaskNumber = data.TaskNumber;
        this.ParentTaskID = data.ParentTaskID;
        this.ParentTaskNumber = data.ParentTaskNumber;
        this.ParentTaskTitle = data.ParentTaskTitle;
        this.JobTitle = data.JobTitle;
        this.JobNumber = data.JobNumber;
        this.JobType = data.JobType;
        this.ClientNickName = data.ClientNickName;
        this.ClientDisplayName = data.ClientDisplayName;
        this.EntryStatusID = data.EntryStatusID;
        this.RowVersion = data.RowVersion;
        this.TimeSheetDayID = data.TimeSheetDayID;
        this.TimesheetEntryID = data.TimesheetEntryID;
        this.TimesheetEntryTypeID = data.TimesheetEntryTypeID;
        this.AbsenceTypeName = data.AbsenceTypeName;
        this.AbsenceType = data.AbsenceType;
        this.LongTermAbsenceID = data.LongTermAbsenceID;
        this.AbsenceTypeID = ko.observable(data.AbsenceTypeID);
        this.AbsenceTypeID.subscribe(function (absenceTypeID) {
            if (absenceTypeID != null && $('#frmEditTimesheet').length > 0) {
                $('#frmEditTimesheet')[0].clear('AbsenceTypeID');
            }
            if (this.MinutesSpent() == '' && this.AbsenceTypeList && this.AbsenceTypeList.length > 0) {
                var absenceType = _.findWhere(this.AbsenceTypeList, { 'AbsenceTypeID': absenceTypeID });
                if (absenceType && absenceType.Vacation)
                    this.FullTime(true);
            }
        }, this);
        this.JobID = ko.observable(data.JobID);
        this.JobID.subscribe(function (value) {
            if (value != null && $('#frmEditTimesheet').length > 0) {
                $('#frmEditTimesheet')[0].clear('JobID');
            }
        });
        this.JobEntryType = data.JobEntryType;
        this.JobEntryTypeID = ko.observable(data.JobEntryTypeID);
        this.JobEntryTypeID.subscribe(function (value) {
            if (value != null && $('#frmEditTimesheet').length > 0) {
                $('#frmEditTimesheet')[0].clear('JobEntryTypeID');
            }
        });
        this.DeliverableName = data.DeliverableName;
        this.DeliverableID = ko.observable(data.DeliverableID);
        this.DeliverableRequired = ko.observable(false);
        this.InvalidDeliverable = ko.observable(false);
        this.ClientID = ko.observable(data.ClientID);
        this.Approvals = ko.observableArray(data.Approvals);
        this.MinutesSpent = ko.observable(data.MinutesSpent);
        this.MinutesSpent.subscribe(function (value) {
            if (value != null && $('#frmEditTimesheet').length > 0) {
                $('#frmEditTimesheet')[0].clear('MinutesSpent');
            }
        });
        this.FormatMinutesSpent = ko.computed(function () {
            return Utils.FormatMinutes(self.MinutesSpent());
        });
        this.MemoEntry = ko.observable(data.MemoEntry);
        this.MemoEntryLength = ko.computed(function () { return (self.MemoEntry() && self.MemoEntry().length > 0); });
        ;
        this.DayID = data.DayID;
        this.LooseJobEntriesAllowed = ko.observable(false);
        this.IsJobMember = ko.observable(false);
        this.JobClosingDate = ko.observable(null);
        this.JobStatus = ko.observable(0);
        this.JobDateAllowed = ko.computed(function () {
            return $M(this.JobClosingDate(), true).diffDays($M(null, true)) >= 0;
        }, this);
        this.ModificationDate = ko.observable(data.ModificationDate);
        this.ModificationUserID = ko.observable(data.ModificationUserID);
        this.CreationDate = ko.observable(data.CreationDate);
        this.TimesheetAutoFulfillID = ko.observable(data.TimesheetAutoFulfillID);
        this.FullTime = ko.observable(data.FullTime || false);
        this.FullTime.subscribe(function (full) {
            if (full) {
                this.LastMinutesSpentValue = this.MinutesSpent();
                this.MinutesSpent(0);
            }
            else
                this.MinutesSpent(this.LastMinutesSpentValue);
        }, this);
        this.UserCanEdit = ko.computed(function () {
            if (this.TimesheetAutoFulfillID() > 0)
                return false;
            if (this.TimesheetEntryTypeID == TimesheetEntryType.Absence && this.AbsenceType && this.AbsenceType.HumanResourceRestricted)
                return false;
            return true;
        }, this);
        this.FadeOff = ko.observable(false);
    }
    TimesheetEntryPartialModel.prototype.Reset = function () {
        this.ApprovalComment('');
        this.TaskID = 0;
        this.TaskTitle = undefined;
        this.ParentTaskID = undefined;
        this.ParentTaskTitle = undefined;
        this.JobTitle = undefined;
        this.JobNumber = undefined;
        this.JobType = undefined;
        this.ClientNickName = undefined;
        this.ClientDisplayName = undefined;
        this.EntryStatusID = undefined;
        this.RowVersion = '0';
        this.TimeSheetDayID = undefined;
        this.TimesheetEntryID = 0;
        this.LongTermAbsenceID = undefined;
        this.AbsenceTypeID(undefined);
        this.JobID(undefined);
        this.ClientID(undefined);
        this.Approvals.removeAll();
        this.MinutesSpent(0);
        this.MemoEntry('');
        this.LooseJobEntriesAllowed(false);
        this.IsJobMember(false);
        this.JobClosingDate(null);
        this.JobStatus(0);
        this.ModificationDate(undefined);
        this.ModificationUserID(undefined);
        this.CreationDate(undefined);
        this.TimesheetAutoFulfillID(undefined);
        this.JobEntryTypeID(undefined);
        this.DeliverableID(undefined);
        this.DeliverableName = undefined;
        this.DeliverableRequired(false);
        this.InvalidDeliverable(false);
        this.FullTime(false);
        this.FadeOff(false);
    };
    return TimesheetEntryPartialModel;
}());
var EnumTimesheetTab;
(function (EnumTimesheetTab) {
    EnumTimesheetTab[EnumTimesheetTab["Timesheet"] = 1] = "Timesheet";
    EnumTimesheetTab[EnumTimesheetTab["OvertimeAuthorization"] = 2] = "OvertimeAuthorization";
})(EnumTimesheetTab || (EnumTimesheetTab = {}));
define(function () {
    return Timesheet;
});
//# sourceMappingURL=Timesheet.js.map