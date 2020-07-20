///<reference path="../../Main/App.ts"/>
///<reference path="../Administrative/Team/UserDetail.ts"/>
///<reference path="../Administrative/Team/NewUser.ts"/>
///<reference path="../Client/ClientDetail.ts"/>
///<reference path="../Expense/ExpenseApproval.ts"/>
///<reference path="TaskDetail.ts"/>
var TaskCentral = /** @class */ (function () {
    function TaskCentral() {
        this.tasklistRefreshTimeout = null;
        this.taskDataRefreshTimeout = null;
        this.recentTasksRefreshTimeout = null;
        this.pendingsRefreshTimeout = null;
        this.currentContainer = '';
        this.clearFiltersOnReload = true;
        this.notificationQueue = [];
        this.pendingImageVerifierInterval = 0;
        this.unloading = false;
        this.localCacheEnabled = true;
        this.autoRefreshTimeout = 0;
        this.taskCentral = true;
        this.taskOpen = false;
        this.creatingClient = false;
        this.expenseApproval = null;
        //#endregion Load Tabs
    }
    TaskCentral.prototype.CurrentSection = function () {
        return Section.TaskCentral;
    };
    TaskCentral.prototype.HasOwnMenu = function () {
        return true;
    };
    TaskCentral.prototype.CurrentContext = function () {
        return [];
    };
    TaskCentral.prototype.Setup = function (options) {
    };
    TaskCentral.prototype.Action = function (options) {
        //console.log('teste ');
        options = options || {};
        var self = this;
        if (options.closeAuxContent) {
            if (self.clearFiltersOnReload)
                self.ClearTaskCentralFilters();
            else
                self.clearFiltersOnReload = true;
            self.CloseDashboardContent();
            self.ShowContainer('tasklistContainer');
            if (self.searchBox)
                self.searchBox.RefreshContext([]);
            return;
        }
        //Define a ação complementar
        var sideAction = null;
        if (options.openTask) {
            sideAction = function () { self.OpenTask(options); };
        }
        else if (options.showPendings) {
            sideAction = function () { self.ShowPendings(); };
        }
        else if (options.showTeam) {
            if (options.viewUserID && options.edit) {
                sideAction = function () {
                    self.OpenUser(options.viewUserID);
                };
            }
            else if (options.viewUserID && !options.edit) {
                sideAction = function () {
                    self.ViewUser(options.viewUserID);
                };
            }
            else if (options.newUser) {
                var externalUser = options.externalUser;
                sideAction = function () { self.NewUser(externalUser); };
            }
            else {
                sideAction = function () {
                    self.ShowTeam();
                };
            }
        }
        else if (options.newClient) {
            sideAction = function () { self.NewClient(); };
        }
        //Abre a tasklist e executa a ação complementar, somente abre a tasklist, ou somente executa a ação complementar
        if (options.openTaskCentral && sideAction) {
            this.ClearTaskCentralFilters();
            this.LoadTaskCentral(function () {
                sideAction();
            });
        }
        else if (sideAction) {
            sideAction();
        }
        else {
            this.ClearTaskCentralFilters();
            this.LoadTaskCentral();
        }
    };
    TaskCentral.prototype.ShowContainer = function (containerID) {
        var self = this;
        $('.task-central-container').not('#' + containerID).fadeOut('fast', function () {
            if (self.currentContainer != containerID) {
                $('#' + containerID).fadeIn('fast', function () {
                    setTimeout(function () {
                        self.SetupTasklistScroll();
                    }, 100);
                });
            }
            self.currentContainer = containerID;
        });
    };
    TaskCentral.prototype.LoadUserConnection = function (callback) {
        var self = this;
        Api.Get('User/GetUserConnection', { userID: environmentData.currentUserID, appMainCompanyID: environmentData.appMainCompanyID }, function (data) {
            if (data.Success) {
                self.viewModel.UserConnection(data.Entity);
                $('#btnMyClients').popover({
                    html: true,
                    placement: 'bottom',
                    title: Utils.FormatTitlePopover($('#btnMyClients')[0], Resources.Commons.MyClients, true),
                    content: function () {
                        $('#btnMyJobs').popover('hide');
                        $('#btnMyGroups').popover('hide');
                        var content = $('<div class="row-fluid info-popover">').attr('id', 'myClientsContainer');
                        var ul = $('<ul>');
                        _.each(data.Entity.ClientList, function (c) {
                            var li = $('<li>');
                            $('<a>').attr('href', URLs.BuildUrl(c.UrlData)).text(c.DisplayName).appendTo(li);
                            li.appendTo(ul);
                        });
                        var listContainer = $('<div class="span11">');
                        ul.appendTo(listContainer);
                        listContainer.appendTo(content);
                        return content;
                    },
                    callback: function () {
                        $('#myClientsContainer').jsScroll();
                        Utils.SetupHidePopover($('#btnMyClients')[0], 'myClientsContainer');
                    }
                }).addListener('click', function (e) { e.stopPropagation(); });
                $('#btnMyJobs').popover({
                    html: true,
                    placement: 'bottom',
                    title: Utils.FormatTitlePopover($('#btnMyJobs')[0], Resources.Commons.MyJobs, true),
                    content: function () {
                        $('#btnMyClients').popover('hide');
                        $('#btnMyGroups').popover('hide');
                        var content = $('<div class="row-fluid info-popover">').attr('id', 'myJobsContainer');
                        var ul = $('<ul>');
                        _.each(data.Entity.JobList, function (j) {
                            var li = $('<li>');
                            $('<a>').attr('href', URLs.BuildUrl(j.UrlData)).text('#' + j.JobNumber + ' ' + j.JobTitle).appendTo(li);
                            li.appendTo(ul);
                        });
                        var listContainer = $('<div class="span11">');
                        ul.appendTo(listContainer);
                        listContainer.appendTo(content);
                        return content;
                    },
                    callback: function () {
                        Utils.SetupHidePopover($('#btnMyJobs')[0], 'myJobsContainer');
                        $('#myJobsContainer').jsScroll();
                    }
                }).addListener('click', function (e) { e.stopPropagation(); });
                $('#btnMyGroups').popover({
                    html: true,
                    placement: 'bottom',
                    title: Utils.FormatTitlePopover($('#btnMyGroups')[0], Resources.Commons.MyGroups, true),
                    content: function () {
                        $('#btnMyClients').popover('hide');
                        $('#btnMyJobs').popover('hide');
                        var content = $('<div class="row-fluid info-popover">').attr('id', 'myGroupsContainer');
                        var ul = $('<ul>');
                        _.each(data.Entity.GroupList, function (g) {
                            var li = $('<li>');
                            $('<span>').text(g.GroupName).appendTo(li);
                            li.appendTo(ul);
                        });
                        var listContainer = $('<div class="span11">');
                        ul.appendTo(listContainer);
                        listContainer.appendTo(content);
                        return content;
                    },
                    callback: function () {
                        Utils.SetupHidePopover($('#btnMyGroups')[0], 'myGroupsContainer');
                        $('#myGroupsContainer').jsScroll();
                    }
                }).addListener('click', function (e) { e.stopPropagation(); });
                if (callback)
                    callback();
            }
        });
    };
    TaskCentral.prototype.SetTaskCentralLocalData = function (callback) {
        var localDataKey = "TaskCentralData";
        var data = Utils.PrepareObjectLocalStorage(this.serverData);
        console.log('SetTaskCentralLocalData', ((new Date()).getTime() / 1000) % 1000);
        taskrow.localDB.SetObject(localDataKey, data, callback);
    };
    TaskCentral.prototype.GetTaskCentralData = function (callback, resolveLocal) {
        var _this = this;
        var localDataKey = "TaskCentralData";
        var serverCallback = function (serverData, status) {
            if (serverData.TaskList && !serverData.TaskList.Unchanged) {
                taskrow.localDB.SetObject(localDataKey, serverData, function () { });
                if (callback)
                    callback(serverData, status, false);
            }
            else if (serverData.TaskList && serverData.TaskList.Unchanged)
                taskrow.localDB.GetObject(localDataKey, function (oldLocalData, status) {
                    if (callback)
                        callback(oldLocalData, status, true);
                });
        };
        var getLocalDataCallback;
        getLocalDataCallback = function (localData, success) {
            if (!success || !localData)
                _this.GetTaskCentralDataFromServer(serverCallback, "");
            else
                _this.GetTaskCentralDataFromServer(serverCallback, localData.TaskList.TasklistGUID);
        };
        if (this.localCacheEnabled)
            taskrow.localDB.GetObject(localDataKey, getLocalDataCallback);
        else
            setTimeout(getLocalDataCallback.bind(this, null, false), 0);
    };
    TaskCentral.prototype.GetTaskCentralDataFromServer = function (callback, localVersion) {
        var dataUrl = 'Task/TaskCentral';
        var self = this;
        var settingsViewModel = new TaskCentralSettingsViewModel();
        settingsViewModel.ReadStorageSettings();
        var taskCentralData = { settings: { HideThirdSubTasks: !settingsViewModel.ShowThirdUsersSubtasks() }, taskListGUID: localVersion };
        Api.Ajax({
            url: dataUrl,
            data: Utils.ToParams(taskCentralData),
            success: function (data, status) {
                callback(data, status);
            }
        });
    };
    TaskCentral.prototype.SetRecentTasksLocalData = function (callback) {
        var localDataKey = "TaskCentralRecentTasksData";
        var data = Utils.PrepareObjectLocalStorage(this.recentTasksServerData);
        taskrow.localDB.SetObject(localDataKey, data, callback);
    };
    TaskCentral.prototype.GetRecentTasksData = function (callback, resolveLocal) {
        var _this = this;
        var localDataKey = "TaskCentralRecentTasksData";
        var serverCallback = function (serverData, status) {
            if (serverData.RecentTasks && !serverData.RecentTasks.Unchanged) {
                taskrow.localDB.SetObject(localDataKey, serverData, function () { });
                if (callback)
                    callback(serverData, status, false);
            }
            else if (serverData.RecentTasks && serverData.RecentTasks.Unchanged)
                taskrow.localDB.GetObject(localDataKey, function (oldLocalData, status) {
                    if (callback)
                        callback(oldLocalData, status, true);
                });
        };
        var getLocalDataCallback;
        if (!resolveLocal) {
            getLocalDataCallback = function (localData, success) {
                if (!success || !localData)
                    _this.GetRecentTasksDataFromServer(serverCallback, "");
                else
                    _this.GetRecentTasksDataFromServer(serverCallback, localData.RecentTasks.TasklistGUID);
            };
        }
        else {
            getLocalDataCallback = function (localData, success) {
                if (callback)
                    callback(localData, status, success);
            };
        }
        if (resolveLocal)
            taskrow.localDB.GetObject(localDataKey, getLocalDataCallback);
        else if (this.localCacheEnabled)
            taskrow.localDB.GetObject(localDataKey, getLocalDataCallback);
        else
            setTimeout(getLocalDataCallback.bind(this, null, false), 0);
    };
    TaskCentral.prototype.GetRecentTasksDataFromServer = function (callback, localVersion) {
        var dataUrl = 'Task/ListRecentTasks';
        var self = this;
        var settingsViewModel = new TaskCentralSettingsViewModel();
        settingsViewModel.ReadStorageSettings();
        var taskCentralData = { settings: { HideThirdSubTasks: !settingsViewModel.ShowThirdUsersSubtasks() }, taskListGUID: localVersion };
        Api.Ajax({
            url: dataUrl,
            data: Utils.ToParams(taskCentralData),
            success: function (data, status) {
                callback(data, status);
            }
        });
    };
    TaskCentral.prototype.OnLoadTaskCentral = function (data, status, callback) {
        var _this = this;
        var self = this;
        var mainContent = $('#main');
        var template = 'Task/TaskCentral', templateUrl = taskrow.templatePath + template;
        var settingsViewModel = new TaskCentralSettingsViewModel();
        settingsViewModel.ReadStorageSettings();
        if (data.Success === false) {
            taskrow.FinishLoadModule();
            UI.Alert(data.Message);
            Navigation.GoBack();
            return;
        }
        this.lastTasklistRefresh = new Date();
        this.SetData(data);
        this.viewModel = new TaskCentralViewModel(data, environmentData.Permissions, environmentData.User);
        this.viewModel.Tasklist.ApplySettings(settingsViewModel);
        taskrow.LoadTemplate(templateUrl, function (getHTML) {
            taskrow.FinishLoadModule();
            mainContent.html(getHTML({}));
            _this.pendingImageVerifierInterval = setInterval(function (x) { return x.VerifyPendingImages(); }, 5000, _this);
            ko.applyBindings(_this.viewModel, $('#dashboard')[0]);
            $('#tasklist').scrollableAccordeon();
            $('#recentTasksList').scrollableAccordeon();
            $('#pendingList').scrollableAccordeon();
            _this.SetupSearchBox();
            _this.SetupTasklistScroll();
            _this.SetupWallPost();
            _this.SetupNotificationsAuthorize();
            _this.viewModel.Tasklist.ObserveRefresh(function () {
                if (_this.tasklistRefreshTimeout)
                    clearTimeout(self.tasklistRefreshTimeout);
                _this.tasklistRefreshTimeout = setTimeout(function () {
                    $('#tasklist').scrollableAccordeon('refresh', true);
                    _this.MarkCurrentTask();
                    _this.tasklistRefreshTimeout = null;
                }, 300);
            });
            _this.viewModel.RecentTasks.ObserveRefresh(function () {
                if (_this.recentTasksRefreshTimeout)
                    clearTimeout(self.recentTasksRefreshTimeout);
                _this.recentTasksRefreshTimeout = setTimeout(function () {
                    $('#recentTasksList').scrollableAccordeon('refresh', true);
                    _this.MarkCurrentTask();
                    _this.recentTasksRefreshTimeout = null;
                }, 300);
            });
            _this.viewModel.Pendings.ObserveRefresh(function () {
                if (_this.pendingsRefreshTimeout)
                    clearTimeout(_this.pendingsRefreshTimeout);
                _this.pendingsRefreshTimeout = setTimeout(function () {
                    $('#pendingList').scrollableAccordeon('refresh', true);
                    _this.pendingsRefreshTimeout = null;
                }, 300);
            });
            setTimeout(function () {
                _this.SetupTasklistScroll();
            }, 1000);
            $(window).addListener('resize', _this.SetupTasklistScroll);
            _this.OnFocus = _this.OnFocus.bind(_this);
            $(window).addListener('focus', _this.OnFocus.bind(_this));
            _this.LoadUserConnection();
            if (callback)
                callback();
            else
                _this.ShowContainer('tasklistContainer');
            setTimeout(function () {
                Tutorial.ShowDesktopTourOnce();
            }, 1000);
            Menu.LoadMenu(Menus.TaskMenu());
        });
    };
    TaskCentral.prototype.LoadTaskCentral = function (callback) {
        var _this = this;
        var mainContent = $('#main');
        var self = this;
        var settingsViewModel = new TaskCentralSettingsViewModel();
        settingsViewModel.ReadStorageSettings();
        var taskCentralData = { settings: { HideThirdSubTasks: !settingsViewModel.ShowThirdUsersSubtasks() } };
        this.GetTaskCentralData(function (data, status, resolvedLocal) {
            _this.OnLoadTaskCentral(data, status, callback);
        });
        if (!this.taskDataRefreshTimeout)
            this.taskDataRefreshTimeout = setInterval(function () { return _this.RefreshTaskData(true); }, 2 * 60 * 1000);
    };
    TaskCentral.prototype.LoadRecentTasks = function (callback) {
        var _this = this;
        var self = this;
        var settingsViewModel = new TaskCentralSettingsViewModel();
        settingsViewModel.ReadStorageSettings();
        var recentTasksData = { settings: { HideThirdSubTasks: !settingsViewModel.ShowThirdUsersSubtasks() } };
        this.GetRecentTasksData(function (data, status, resolvedLocal) {
            //console.log(['GetRecentTasksData callback data', data]);
            _this.recentTasksServerData = data;
            _this.viewModel.RecentTasks.RefreshData(data);
            _this.viewModel.RecentTasks.ApplySettings(settingsViewModel);
            setTimeout(function () {
                _this.SetupTasklistScroll();
            }, 0);
            if (callback)
                callback();
        });
    };
    TaskCentral.prototype.ClearTaskCentralFilters = function () {
        if (this.viewModel) {
            this.viewModel.Tasklist.Filters.FilterSettings.ClearFilterText();
            this.viewModel.Tasklist.Filters.FilterSettings.ClearFilterUsers();
            this.viewModel.Tasklist.Filters.FilterSettings.ClearFilterClientJob();
            this.viewModel.Tasklist.Filters.FilterSettings.BasicFilter('0');
        }
    };
    TaskCentral.prototype.ChangeViewMode = function (viewMode, basicFilter) {
        var changeViewModeFn = function () {
            this.viewModel.ChangeViewMode(viewMode, basicFilter);
        }.bind(this);
        if (viewMode == TasklistViewMode.Recents && !this.viewModel.RecentTasks.Loaded())
            this.LoadRecentTasks(changeViewModeFn);
        else
            changeViewModeFn();
    };
    TaskCentral.prototype.SetupNotificationsAuthorize = function () {
        var $btn = $('#btnRequestNotificationsAuthorize');
        SystemNotification.CheckNotificationPermission($btn[0]);
    };
    TaskCentral.prototype.PrepareTaskMessage = function (taskMessage) {
        taskMessage.DueDate = moment(taskMessage.DueDate).toJsonDate(true);
        taskMessage.CreationDate = moment(taskMessage.CreationDate).toJsonDate(true);
    };
    TaskCentral.prototype.RefreshTaskData = function (ignoreLocalData) {
        var _this = this;
        this.GetTaskCentralData(function (data, status, resolvedLocal) {
            if (ignoreLocalData && resolvedLocal) {
                console.log('local data ignored');
                console.log('returned data', data.TaskList.TasklistGUID, 'page data', _this.serverData.TaskList.TasklistGUID);
                return;
            }
            _this.SetData(data);
            _this.viewModel.RefreshTasklistData(data);
            $('#tasklist').scrollableAccordeon('refresh', true);
            _this.VerifyUnreadTasks();
        });
    };
    TaskCentral.prototype.ApplyNotification = function (taskData, previousGUID, tasklistGUID) {
        console.log('ApplyNotification', ((new Date()).getTime() / 1000) % 1000);
        if (this.serverData.TaskList.TasklistGUID != previousGUID) {
            //Se perdeu alguma coisa no meio, ignora a modificação e dispara um refresh
            setTimeout(function () {
                this.RefreshTaskData.call(this);
                if (this.recentTasksServerData)
                    this.LoadRecentTasks.call(this);
            }.bind(this), 0);
            return;
        }
        try {
            //Caso o recent tasks data já tiver sido carregado
            if (this.recentTasksServerData) {
                //sempre atualizar tarefas recentes quando houve alteração na tarefa
                var recentTask = _(this.recentTasksServerData.RecentTasks).findWhere({ "TaskID": taskData.TaskID });
                if (recentTask) {
                    var ix = this.recentTasksServerData.RecentTasks.indexOf(recentTask);
                    if (ix > -1) {
                        this.recentTasksServerData.RecentTasks.splice(ix, 1, taskData);
                        this.recentTasksServerData.RecentTasks = _(this.recentTasksServerData.RecentTasks).sortBy(function (x) { return -$M(x.LastItem.Date).toDate().getTime(); });
                    }
                }
                else
                    this.recentTasksServerData.RecentTasks.unshift(taskData);
                this.SetRecentTasksLocalData(function () { });
            }
        }
        catch (e) {
            console.log(e);
        }
        ;
        var tasklist = this.serverData.TaskList;
        var task = _(tasklist.OwnedTasks).findWhere({ "TaskID": taskData.TaskID });
        var taskAdded = false;
        var refreshNeeded = true;
        this.PrepareTaskMessage(taskData);
        if (task) {
            var ix = tasklist.OwnedTasks.indexOf(task);
            tasklist.OwnedTasks.splice(ix, 1);
            if (taskData.RowVersion == task.RowVersion)
                refreshNeeded = false;
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
                if (prevDueDate == taskData.DueDate && prevDueDateOrder + 1 == taskData.DueDateOrder)
                    prevDueDateOrder++;
            }
            tasklist.OwnedTasks.push(taskData);
            tasklist.OwnedTasks = _(tasklist.OwnedTasks).sortBy(function (x) { return x.DueDate + (1000 + x.DueDateOrder).toString(); });
        }
        task = _(tasklist.DelegatedTasks).findWhere({ "TaskID": taskData.TaskID });
        if (task) {
            if (taskData.RowVersion == task.RowVersion)
                refreshNeeded = false;
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
            if (taskData.RowVersion == task.RowVersion)
                refreshNeeded = false;
            var ix = tasklist.ParticipatedTasks.indexOf(task);
            tasklist.ParticipatedTasks.splice(ix, 1);
        }
        var members = taskData.MemberListString.split(',');
        var isMember = _.any(members, function (x) { return x == environmentData.currentUserID; });
        if (!taskAdded && !taskData.Closed && taskData.CreationUserID != environmentData.currentUserID && taskData.OwnerUserID != environmentData.currentUserID && isMember) {
            taskAdded = true;
            tasklist.ParticipatedTasks.push(taskData);
            tasklist.ParticipatedTasks = _(tasklist.ParticipatedTasks).sortBy(function (x) { return x.DueDate + (1000 + x.DueDateOrder).toString(); });
        }
        this.serverData.TaskList.TasklistGUID = tasklistGUID;
        this.serverData.TaskList.PreviousGUID = previousGUID;
        this.SetTaskCentralLocalData(function () { });
        return refreshNeeded;
    };
    TaskCentral.prototype.QueueNotification = function (taskData, previousGUID, tasklistGUID) {
        this.notificationQueue.push([taskData, previousGUID, tasklistGUID]);
        if (this.notificationTimeout)
            return;
        this.notificationTimeout = setTimeout(function (self) {
            self.notificationTimeout = 0;
            var changes = self.notificationQueue;
            self.notificationQueue = [];
            var t1 = (new Date()).getTime();
            var refreshNeeded = false;
            for (var i = 0; i < changes.length; i++) {
                refreshNeeded = self.ApplyNotification.apply(self, changes[i]) || refreshNeeded;
            }
            self.ReapplyServerData();
        }, 5000, this);
    };
    TaskCentral.prototype.NotifyTaskChange = function (taskData, sourceConnectionID, previousGUID, tasklistGUID) {
        if (this.currentTask && this.currentTask.viewModel && this.currentTask.GetTaskOrSubtask(taskData.TaskNumber, taskData.JobNumber)) {
            for (var i = this.notificationQueue.length - 1; i >= 0; i--)
                if (this.notificationQueue[i][0].TaskNumber == taskData.TaskNumber)
                    this.notificationQueue.splice(i, 1);
            var refreshNeeded = this.ApplyNotification(taskData, previousGUID, tasklistGUID);
            var self = this;
            if (refreshNeeded || sourceConnectionID != SignalrHub.MainHub.connection.id) {
                this.ReapplyServerData();
                this.ReloadCurrentTask(taskData);
            }
        }
        else {
            this.QueueNotification(taskData, previousGUID, tasklistGUID);
        }
    };
    TaskCentral.prototype.ReapplyServerData = function (simple) {
        this.viewModel.RefreshTasklistData(this.serverData);
        if (this.recentTasksServerData)
            this.viewModel.RefreshRecentTasksData(this.recentTasksServerData);
        this.MarkCurrentTask();
        if (simple)
            return;
        $('#tasklist').scrollableAccordeon('refresh', true);
        if ($('#recentTasksList').length > 0)
            $('#recentTasksList').scrollableAccordeon('refresh', true);
        this.VerifyUnreadTasks();
    };
    TaskCentral.prototype.MarkCurrentTask = function (taskNumber) {
        if (!taskNumber && !this.currentTask)
            return;
        if (!taskNumber)
            taskNumber = this.currentTask.selectedTaskInfo.taskNumber;
        //marcar na tasklist
        var activeTaskNumber = $('#tasklist').children('ul').children('li.active').attr('data-tasknumber');
        if (!activeTaskNumber || activeTaskNumber != taskNumber.toString()) {
            $('#tasklist').children('ul').children('li').removeClass('active');
            var $liChildren = $('#tasklist').children('ul').children('li[data-tasknumber=' + taskNumber + ']');
            if ($liChildren.length > 0) {
                $liChildren.addClass('active');
            }
            else if (this.currentTask && this.currentTask.viewModel && this.currentTask.viewModel.SelectedTask.TaskData().ParentTaskID > 0) {
                var parentTaskNumber = this.currentTask.viewModel.ParentTask.TaskNumber();
                var $liParentTask = $('#tasklist').children('ul').children('li[data-tasknumber=' + parentTaskNumber + ']');
                if ($liParentTask.length > 0)
                    $liParentTask.addClass('active');
            }
        }
        //marcar nas lista de tarefas recentes
        var activeRecentTaskNumber = $('#recentTasksList').children('ul').children('li.active').attr('data-tasknumber');
        if (!activeRecentTaskNumber || activeRecentTaskNumber != taskNumber.toString()) {
            $('#recentTasksList').children('ul').children('li').removeClass('active');
            var $liChildren = $('#recentTasksList').children('ul').children('li[data-tasknumber=' + taskNumber + ']');
            if ($liChildren.length > 0)
                $liChildren.addClass('active');
        }
    };
    TaskCentral.prototype.FilterDesiredTask = function (taskNumber) {
        return _.filter(this.viewModel.Tasklist.OwnedTasks(), function (task) {
            return task.TaskNumber == taskNumber;
        })[0] || _.filter(this.viewModel.Tasklist.ReturnedTasks(), function (task) {
            return task.TaskNumber == taskNumber;
        })[0] || _.filter(this.viewModel.Tasklist.DelegatedTasks(), function (task) {
            return task.TaskNumber == taskNumber;
        })[0] || _.filter(this.viewModel.Tasklist.ParticipatedTasks(), function (task) {
            return task.TaskNumber == taskNumber;
        })[0] || _.filter(this.viewModel.Tasklist.InternalRequests(), function (task) {
            return task.TaskNumber == taskNumber;
        })[0] || _.filter(this.viewModel.Tasklist.ExternalRequests(), function (task) {
            return task.TaskNumber == taskNumber;
        })[0];
    };
    TaskCentral.prototype.ReloadCurrentTask = function (taskData) {
        if (!this.currentTask || !this.currentTask.viewModel)
            return;
        this.currentTask.ReloadTaskByNotification(taskData);
    };
    TaskCentral.prototype.ScrollToTask = function (taskNumber) {
        $('#tasklist').jsScroll('stopScroll');
        var li = $('#tasklist li[data-tasknumber=' + taskNumber + ']');
        if (li.length == 0)
            return;
        var ul = li.parent();
        var tl = $('#tasklist');
        var sumHeights = _.reduce(ul.prevAll('.sa-group-header-wrapper:visible'), function (a, b) { return a + $(b).outerHeight(); }, 0);
        var scrollTop = li[0].offsetTop - tl[0].offsetTop - sumHeights;
        setTimeout(function () {
            $('#tasklist')[0].scrollTop = scrollTop;
            $('#tasklist').jsScroll('refresh');
        }, 0);
    };
    TaskCentral.prototype.ScrollToRecentTask = function (taskNumber) {
        //console.log(['ScrollToRecentTask, taskNumber', taskNumber]);
        $('#recentTasksList').jsScroll('stopScroll');
        var li = $('#recentTasksList li[data-tasknumber=' + taskNumber + ']');
        if (li.length == 0)
            return;
        var ul = li.parent();
        var tl = $('#recentTasksList');
        var sumHeights = _.reduce(ul.prevAll('.sa-group-header-wrapper:visible'), function (a, b) { return a + $(b).outerHeight(); }, 0);
        var scrollTop = li[0].offsetTop - tl[0].offsetTop - sumHeights;
        setTimeout(function () {
            $('#recentTasksList')[0].scrollTop = scrollTop;
            $('#recentTasksList').jsScroll('refresh');
        }, 0);
    };
    TaskCentral.prototype.MarkTaskAsRead = function (taskNumber) {
        var ret = this.UpdateTask(taskNumber, { Read: true });
        this.SetTaskCentralLocalData(function () { });
        return ret;
    };
    TaskCentral.prototype.UpdateTask = function (taskNumber, properties) {
        var tasklist = this.serverData.TaskList;
        var lists = [tasklist.OwnedTasks, tasklist.ParticipatedTasks, tasklist.DelegatedTasks];
        var self = this;
        var t1 = new Date().getTime();
        for (var i = 0; i < lists.length; i++) {
            var task = _(lists[i]).findWhere({ "TaskNumber": +taskNumber });
            if (task) {
                if (properties.Read && task.OwnerUserID != environmentData.currentUserID)
                    break;
                $.extend(task, properties);
                break;
            }
        }
        var targetTask = this.FilterDesiredTask(taskNumber);
        var markAsRead = false;
        if (targetTask) {
            if (properties.Read && (!targetTask.Read || targetTask.MustRead)) {
                if (targetTask.OwnerUserID == environmentData.currentUserID) {
                    targetTask.Read = true;
                }
                targetTask.MustRead = false;
                targetTask.ReadByMe(true);
                targetTask.UnreadByMe(false);
                markAsRead = true;
            }
            if (properties.Favorite !== undefined) {
                targetTask.Favorite = properties.Favorite;
                targetTask.FavoriteMark(properties.Favorite);
            }
            this.viewModel.Tasklist.OwnedTasks.valueHasMutated();
            this.viewModel.Tasklist.ReturnedTasks.valueHasMutated();
            this.viewModel.Tasklist.DelegatedTasks.valueHasMutated();
            this.viewModel.Tasklist.ParticipatedTasks.valueHasMutated();
            this.viewModel.Tasklist.InternalRequests.valueHasMutated();
            this.viewModel.Tasklist.ExternalRequests.valueHasMutated();
            this.VerifyUnreadTasks();
            this.viewModel.Tasklist.EnsureUnreadTasksFilter();
        }
        //#region Recentes
        if (this.recentTasksServerData) {
            var recentTasksList = this.recentTasksServerData.RecentTasks;
            for (var i = 0; i < recentTasksList.length; i++) {
                var task = _(recentTasksList[i]).findWhere({ "TaskNumber": +taskNumber });
                if (task) {
                    if (properties.Read && task.OwnerUserID != environmentData.currentUserID)
                        break;
                    $.extend(task, properties);
                    break;
                }
            }
            var targetRecentTask = _.filter(this.viewModel.RecentTasks.RecentTasks(), function (task) { return task.TaskNumber == taskNumber; })[0];
            if (targetRecentTask) {
                if (properties.Read && (!targetRecentTask.Read || targetRecentTask.MustRead)) {
                    if (targetRecentTask.OwnerUserID == environmentData.currentUserID) {
                        targetRecentTask.Read = true;
                    }
                    targetRecentTask.MustRead = false;
                    targetRecentTask.ReadByMe(true);
                    targetRecentTask.UnreadByMe(false);
                }
                this.viewModel.RecentTasks.RecentTasks.valueHasMutated();
            }
        }
        //#endregion Recentes
        return markAsRead;
    };
    TaskCentral.prototype.UpdateTaskExtranetAsRead = function (taskNumber) {
        var tasklist = this.serverData.TaskList;
        var lists = [tasklist.OwnedTasks, tasklist.ParticipatedTasks, tasklist.DelegatedTasks];
        for (var i = 0; i < lists.length; i++) {
            var task = _(lists[i]).findWhere({ "TaskNumber": +taskNumber });
            if (task) {
                task.ExternalPending(false);
                break;
            }
        }
        var targetTask = this.FilterDesiredTask(taskNumber);
        if (targetTask) {
            targetTask.ExternalPending(false);
            this.viewModel.Tasklist.OwnedTasks.valueHasMutated();
            this.viewModel.Tasklist.ReturnedTasks.valueHasMutated();
            this.viewModel.Tasklist.DelegatedTasks.valueHasMutated();
            this.viewModel.Tasklist.ParticipatedTasks.valueHasMutated();
            this.viewModel.Tasklist.InternalRequests.valueHasMutated();
            this.viewModel.Tasklist.ExternalRequests.valueHasMutated();
        }
        //#region Recentes
        if (this.recentTasksServerData) {
            var recentTasksList = this.recentTasksServerData.RecentTasks;
            for (var i = 0; i < recentTasksList.length; i++) {
                var task = _(recentTasksList[i]).findWhere({ "TaskNumber": +taskNumber });
                if (task) {
                    task.ExternalPending(false);
                    break;
                }
            }
            var targetRecentTask = _.filter(this.viewModel.RecentTasks.RecentTasks(), function (task) { return task.TaskNumber == taskNumber; })[0];
            if (targetRecentTask) {
                targetRecentTask.ExternalPending(false);
                this.viewModel.RecentTasks.RecentTasks.valueHasMutated();
            }
        }
        //#endregion Recentes
    };
    TaskCentral.prototype.ShowTaskCentralSettings = function () {
        var self = this;
        var settingsViewModel = new TaskCentralSettingsViewModel();
        settingsViewModel.ReadStorageSettings();
        var origintalSettings = new TaskCentralSettingsViewModel();
        origintalSettings.ReadStorageSettings();
        var options = new ModalWindowOptions();
        options.title = Resources.Task.SettingsModalTitle;
        options.style = 'width: 500px;';
        options.closeButton = true;
        options.onClose = (function (e, modal) {
            ko.cleanNode(modal.element);
            self.taskCentralSettingsModal = null;
        }).bind(this);
        var applyButton = new ModalButton();
        applyButton.label = Resources.Commons.Apply;
        applyButton.isPrimary = true;
        applyButton.action = (function (origintalSettings, e) {
            settingsViewModel.WriteStorageSettings();
            this.viewModel.Tasklist.ApplySettings(settingsViewModel);
            //
            this.viewModel.RecentTasks.ApplySettings(settingsViewModel);
            ko.cleanNode(this.taskCentralSettingsModal.element);
            self.taskCentralSettingsModal.close();
            if (origintalSettings.ShowThirdUsersSubtasks() != settingsViewModel.ShowThirdUsersSubtasks())
                this.RefreshTaskData();
        }).bind(this, origintalSettings);
        options.buttons.push(applyButton);
        var resetButton = new ModalButton();
        resetButton.label = Resources.Commons.ResetDefault;
        resetButton.action = (function (e) {
            settingsViewModel.ResetToDefaults();
            settingsViewModel.WriteStorageSettings();
            this.viewModel.Tasklist.ApplySettings(settingsViewModel);
            this.viewModel.RecentTasks.ApplySettings(settingsViewModel);
            $(e.target).removeAttr('disabled');
        }).bind(this);
        options.buttons.push(resetButton);
        UI.ShowModal(taskrow.templatePath + 'Task/TaskCentralSettings', {}, options, function (modal) {
            self.taskCentralSettingsModal = modal;
            ko.applyBindings(settingsViewModel, modal.element);
        });
    };
    TaskCentral.prototype.VerifyUnreadTasks = function () {
        var unreadTasks = _.filter(this.serverData.TaskList.OwnedTasks, function (task) {
            return !task.Read;
        });
        $('#icoNewTasks')[unreadTasks.length > 0 ? 'show' : 'hide']();
        environmentData.UnreadTasksCount(unreadTasks.length);
    };
    TaskCentral.prototype.RefreshPendingsData = function (callback) {
        var self = this;
        Pendings.ListPendings(function (data) {
            self.viewModel.Pendings.RefreshData(data);
            $('#pendingList').scrollableAccordeon('refresh', true);
            if (callback)
                callback();
        });
    };
    TaskCentral.prototype.OpenTask = function (taskInfo) {
        if (this.currentTask) {
            var targetTask = this.currentTask.GetTaskOrSubtask(taskInfo.taskNumber, taskInfo.jobNumber);
            if (targetTask) {
                this.currentTask.SelectTask(targetTask);
                this.MarkCurrentTask(taskInfo.taskNumber);
                return;
            }
        }
        this.ClearCurrentUser();
        this.ClearCurrentPending();
        this.ShowContainer('tasklistContainer');
        this.MarkCurrentTask(taskInfo.taskNumber);
        taskrow.DisplayLoading();
        //caso já esteja exibindo uma tarefa chama o OnClose da mesma antes de alterar para nova task
        if (this.currentTask != null) {
            this.currentTask.unloading = true;
            //self.currentTask = null;
        }
        require(["Scripts/ClientViews/Task/TaskDetail", 'Scripts/Plugins/DynForm', 'Scripts/Plugins/DynFormViewer'], function (ctor) {
            this.currentTask = new ctor();
            this.currentTask.Init(taskInfo, 'ownedTask');
            this.taskOpen = true;
            this.currentTask.Show();
        }.bind(this));
    };
    TaskCentral.prototype.NewClient = function () {
        var self = this;
        self.ShowContainer('tasklistContainer');
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Client/ClientDetail"], function (ctor) {
            self.newClient = new ctor.NewClient();
            self.creatingClient = true;
            self.newClient.Action();
        });
    };
    TaskCentral.prototype.ShowPendings = function () {
        var self = this;
        taskrow.DisplayLoading();
        self.ClearCurrentTask();
        self.ClearCurrentUser();
        self.ClearNewClient();
        self.ClosePendingApprovalDashboardContent();
        self.ShowContainer('pendingListContainer');
        Pendings.ListPendings(function (data) {
            self.viewModel.Pendings.RefreshData(data);
            taskrow.HideLoading();
            self.SetupTasklistScroll();
        });
        if (environmentData.Permissions.ApproveTimesheet) {
            taskrow.DisplayLoading();
            GroupTimesheetApproval.GetUserGroup(function (data) {
                self.viewModel.RefreshGroupsData(data);
                taskrow.HideLoading();
                self.SetupTasklistScroll();
            });
        }
    };
    TaskCentral.prototype.LoadPendingExpenseApproval = function () {
        var self = this;
        self.ClearCurrentPending();
        require(["Scripts/ClientViews/Expense/PendingExpenseApproval"], function (ctor) {
            self.expenseApproval = new ctor();
            self.expenseApproval.Action();
        });
    };
    TaskCentral.prototype.LoadGroupTimesheet = function (groupID) {
        this.ClearCurrentPending();
        GroupTimesheetApproval.ShowGroupTimesheet(groupID);
    };
    TaskCentral.prototype.ShowTeam = function () {
        var self = this;
        self.ClearCurrentTask();
        self.ClearCurrentPending();
        self.CloseUserDashboardContent();
        self.ClearNewClient();
        self.ShowContainer('teamListContainer');
    };
    TaskCentral.prototype.ClearCurrentTask = function () {
        if (this.currentTask != null) {
            this.clearFiltersOnReload = false;
            this.currentTask.OnClose();
        }
        this.currentTask = null;
        this.taskOpen = false;
        var task = $('.dashboard-content.task-details');
        task.remove();
        $('#tasklist').children('ul').children('li').removeClass('active');
        $('#recentTasksList').children('ul').children('li').removeClass('active');
    };
    TaskCentral.prototype.ClearNewClient = function () {
        this.newClient = null;
        var newClientContainer = $('.dashboard-content.new-client');
        newClientContainer.remove();
    };
    TaskCentral.prototype.CloseDashboardContent = function () {
        this.ClearCurrentTask();
        this.ClearCurrentUser();
        this.ClearCurrentPending();
        this.ClearNewClient();
        var taskCentralHome = $('#divDashBoard');
        if (taskCentralHome.length == 0)
            return;
        taskCentralHome[0].style.display = '';
        if (location.hash != '#taskcentral')
            location.href = '#taskcentral';
    };
    TaskCentral.prototype.ClearCurrentUser = function () {
        if (this.newUser) {
            this.newUser.Unload();
            var newUser = $('.dashboard-content.new-user');
            newUser.remove();
        }
        if (this.currentUser) {
            this.currentUser.Unload();
            var users = $('.dashboard-content.user-details');
            users.remove();
        }
        if (this.organizationChart) {
            this.organizationChart.Unload();
            var userOrganizationChart = $('.dashboard-content.user-organization-chart');
            userOrganizationChart.remove();
        }
        this.newUser = null;
        this.currentUser = null;
        this.organizationChart = null;
        $('#teamList').children('li').removeClass('active');
    };
    TaskCentral.prototype.CloseUserDashboardContent = function () {
        this.ClearCurrentUser();
        var taskCentralHome = $('#divDashBoard');
        if (taskCentralHome.length == 0)
            return;
        taskCentralHome[0].style.display = '';
        if (window.location.hash != '#taskcentral/team')
            window.location.href = '#taskcentral/team';
    };
    TaskCentral.prototype.ClearCurrentPending = function () {
        GroupTimesheetApproval.ClearGroup();
        var pedings = $('.dashboard-content.group-timesheet-approval');
        pedings.remove();
        if (this.expenseApproval)
            this.expenseApproval.Unload();
        var pedingsExpenses = $('.dashboard-content.expense-approval');
        pedingsExpenses.remove();
        $('#pendingList').children('li').removeClass('active');
    };
    TaskCentral.prototype.OnFocus = function () {
        this.RefreshTaskData(true);
    };
    TaskCentral.prototype.ClosePendingApprovalDashboardContent = function () {
        this.ClearCurrentPending();
        var taskCentralHome = $('#divDashBoard');
        if (taskCentralHome.length == 0)
            return;
        taskCentralHome[0].style.display = '';
        if (window.location.hash != '#taskcentral/pendings')
            window.location.href = '#taskcentral/pendings';
    };
    TaskCentral.prototype.Unload = function () {
        if (this.tasklistRefreshTimeout)
            clearInterval(this.tasklistRefreshTimeout);
        this.tasklistRefreshTimeout = 0;
        if (this.taskDataRefreshTimeout)
            clearInterval(this.taskDataRefreshTimeout);
        this.taskDataRefreshTimeout = 0;
        if (this.searchBox)
            this.searchBox.Unload();
        $(window).unbind('resize', this.SetupTasklistScroll);
        Utils.CleanNode($('#dashboard')[0]);
        if (this.viewModel)
            this.viewModel.Unload();
        if (GroupTimesheetApproval)
            GroupTimesheetApproval.Unload();
        if (this.attachments)
            this.attachments.Destroy();
        if (this.userExpenses) {
            this.userExpenses.Destroy();
            this.userExpenses = null;
        }
        clearInterval(this.pendingImageVerifierInterval);
    };
    TaskCentral.prototype.SetData = function (data) {
        this.serverData = data;
    };
    TaskCentral.prototype.SetupSearchBox = function () {
        var context = [];
        var searchBox = $('#searchBox')[0];
        this.searchBox = new ContextSearch(searchBox, context);
        this.searchBox.selectItemCallback = function (data) {
            Navigation.SendEvent('Busca', 'Task Central', undefined, undefined);
        };
        this.searchBox.Init();
    };
    TaskCentral.prototype.ToggleFilter = function (filterName) {
        var self = this;
        var arr = [];
        var options = {
            duration: 200,
            complete: function () {
                self.SetupTasklistScroll();
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
        $('#tasklist-filters .filter-' + filterName).slideToggle(options);
    };
    TaskCentral.prototype.ToggleRecentTasksFilter = function (filterName) {
        var self = this;
        var arr = [];
        var options = {
            duration: 200,
            complete: function () {
                self.SetupTasklistScroll();
            },
            step: function (now, tween) {
                if (tween.prop == 'height') {
                    if (tween.end > tween.now)
                        $('#recentTasksList').css('margin-top', (tween.end - tween.now) + 'px');
                    else
                        $('#recentTasksList').css('margin-top', null);
                }
            }
        };
        $('#recenttasks-filters .filter-' + filterName).slideToggle(options);
    };
    TaskCentral.prototype.CalendarScroll = function () {
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
    TaskCentral.prototype.ToggleCalendarWeekends = function () {
        if ($('#taskCalendar')[0].scrollLeft < 5) {
            var scrollLeft = $('#taskCalendar .table-wrapper').width() - $('#taskCalendar').width() + 10;
            $('#taskCalendar').animate({ 'scrollLeft': scrollLeft + 'px' });
        }
        else {
            $('#taskCalendar').animate({ 'scrollLeft': '0px' });
        }
    };
    TaskCentral.prototype.SetupTasklistScroll = function () {
        if ($('#tasklist').length > 0) {
            UI.SetupPositionFixedElementHeight($('#tasklist'));
            $('#tasklist').jsScroll();
            $('#tasklist').attr('scrollEnabled', 'true');
            $('#tasklist').scrollableAccordeon('refresh', true);
        }
        if ($('#recentTasksList').length > 0) {
            UI.SetupPositionFixedElementHeight($('#recentTasksList'));
            $('#recentTasksList').jsScroll();
            $('#recentTasksList').attr('scrollEnabled', 'true');
            $('#recentTasksList').scrollableAccordeon('refresh', true);
        }
        if ($('#pendingList').length > 0) {
            UI.SetupPositionFixedElementHeight($('#pendingList'));
            $('#pendingList').jsScroll();
            $('#pendingList').attr('scrollEnabled', 'true');
            $('#pendingList').scrollableAccordeon('refresh', true);
        }
        if ($('#teamList').length > 0) {
            UI.SetupPositionFixedElementHeight($('#teamList'));
            $('#teamList').jsScroll();
        }
        if ($('#taskCalendar').length > 0) {
            var calendar = $('#taskCalendar');
            UI.SetupPositionFixedElementHeight($('#taskCalendar'));
            calendar.jsScroll();
            $('#taskCalendar').bind('scroll', this.CalendarScroll);
        }
        if ($('.dropdown-companies-project').length > 0)
            $('.dropdown-companies-project').jsScroll();
    };
    //#region User
    TaskCentral.prototype.ViewUser = function (userID) {
        var self = this;
        this.ClearCurrentTask();
        this.ClearCurrentPending();
        this.ClearNewClient();
        this.ClearCurrentUser();
        this.ShowContainer('teamListContainer');
        $('#teamList').children('li').removeClass('active');
        $('#teamList li[data-userid=' + userID + ']').addClass('active');
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Administrative/Team/OrganizationChart"], function (ctor) {
            self.organizationChart = new ctor();
            self.organizationChart.Action({ UserID: userID });
        });
    };
    TaskCentral.prototype.OpenUser = function (userID) {
        var self = this;
        this.ClearCurrentTask();
        this.ClearCurrentPending();
        this.ClearNewClient();
        this.ClearCurrentUser();
        if (this.currentContainer != 'teamListContainer')
            this.ShowContainer('teamListContainer');
        $('#teamList').children('li').removeClass('active');
        $('#teamList li[data-userid=' + userID + ']').addClass('active');
        var saveUserCallback = function (data) {
            //taskrow.EnqueueUserListRefresh(1);
        };
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Administrative/Team/UserDetail"], function (ctor) {
            self.currentUser = new ctor();
            self.currentUser.saveCallback = saveUserCallback;
            self.currentUser.Action({ UserID: userID });
        });
    };
    TaskCentral.prototype.NewUser = function (externalUser) {
        var self = this;
        if (!environmentData.Permissions.EditUser)
            return;
        self.ClearCurrentUser();
        $('#teamList').children('li').removeClass('active');
        var saveNewUserCallback = function (data) {
            window.location.href = '#taskcentral/team/' + data.User.UserID;
        };
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Administrative/Team/NewUser"], function (ctor) {
            self.newUser = new ctor();
            self.newUser.saveCallback = saveNewUserCallback;
            self.newUser.Action({ externalUser: externalUser });
        });
    };
    TaskCentral.prototype.SetupWallPost = function () {
        var self = this;
        var reqData = { limit: 5, wallPostListID: null, lastUpdateTime: null };
        Api.Get('/Wall/GetUserWall', reqData, this.LoadUserWallData.bind(this));
    };
    TaskCentral.prototype.LoadUserWallData = function (data) {
        if (this.unloading)
            return;
        this.wallPost = new WallPost($('#user_wall')[0], data, false);
        this.wallPost.userWall = true;
        this.wallPost.Init();
    };
    TaskCentral.prototype.VerifyPendingImages = function () {
        if (Cookies.Get('pending_images')) {
            Cookies.Set('pending_images', null);
            _($(' .text-comment img, .newTaskItemComment img, #taskImagesThumbs img, .wall-post img')).filter(function (x) { return (x.src || '').toLowerCase().indexOf('file/') >= 0; }).map(function (item) { item.src += '&n=' + (new Date()).getTime(); });
        }
    };
    //#endregion
    //#region Load Tabs
    TaskCentral.prototype.UnloadTabs = function () {
        var self = this;
        if (self.notes != null) {
            self.notes.Destroy();
            self.notes = null;
        }
        if (self.attachments != null) {
            self.attachments.Destroy();
            self.attachments = null;
        }
        if (self.userExpenses != null) {
            self.userExpenses.Destroy();
            self.userExpenses = null;
        }
    };
    TaskCentral.prototype.LoadTabWall = function (elem) {
        this.UnloadTabs();
        //ativar tab
        $("#divDashBoard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        this.SelectTabs("tab-wall");
    };
    TaskCentral.prototype.LoadTabNotes = function (elem) {
        this.UnloadTabs();
        //ativar tab
        $("#divDashBoard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        var self = this;
        var tabNotesContent = $('#user_notes');
        var template = 'Partials/Notes', templateUrl = taskrow.templatePath + template;
        require(['Scripts/Plugins/Notes'], function (ctor) {
            self.notes = new ctor();
            taskrow.LoadTemplate(templateUrl, function (getHTML) {
                tabNotesContent.html(getHTML({}));
                self.notes.Init("user_notes", EnumNoteType.User, environmentData.currentUserID);
                self.SelectTabs("tab-notes");
            });
        });
    };
    TaskCentral.prototype.LoadTabFiles = function (elem) {
        this.UnloadTabs();
        //ativar tab
        $("#divDashBoard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        var self = this;
        var tabFilesContent = $('#user_files');
        var template = 'Partials/Attachments', templateUrl = taskrow.templatePath + template;
        taskrow.DisplayLoading();
        require(['Scripts/Plugins/Attachments'], function (ctor) {
            self.attachments = new ctor();
            taskrow.LoadTemplate(templateUrl, function (getHTML) {
                tabFilesContent.html(getHTML({}));
                self.attachments.Init(tabFilesContent[0], EnumAttachmentsMode.User);
                self.SelectTabs("tab-files");
                taskrow.HideLoading();
            });
        });
    };
    TaskCentral.prototype.LoadTabUserExpenses = function (elem) {
        this.UnloadTabs();
        this.ClearCurrentTask();
        this.ClearCurrentUser();
        this.ClearCurrentPending();
        this.ClearNewClient();
        $('#divDashBoard').show();
        //ativar tab
        $("#divDashBoard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        var self = this;
        var tabExpensesContent = $('#user_expenses');
        var template = 'Partials/Expenses', templateUrl = taskrow.templatePath + template;
        taskrow.DisplayLoading();
        require(['Scripts/Plugins/Expenses'], function (ctor) {
            self.userExpenses = new ctor();
            taskrow.LoadTemplate(templateUrl, function (getHTML) {
                tabExpensesContent.html(getHTML({}));
                self.userExpenses.Init(tabExpensesContent[0]);
                self.SelectTabs("tab-user-expenses");
                taskrow.HideLoading();
            });
        });
    };
    TaskCentral.prototype.SelectTabs = function (tab) {
        $("#tab-content-detail .tab-pane").removeClass("active");
        $("#" + tab).addClass("active");
    };
    return TaskCentral;
}());
var TaskCentralViewModel = /** @class */ (function () {
    function TaskCentralViewModel(data, permissions, user) {
        var originalData = data;
        this.nextData = null;
        this.Tasklist = new TasklistPartialModel({});
        this.RecentTasks = new RecentTasksPartialModel();
        this.Pendings = new PendingsPartialModel({});
        this.Groups = new DataSource([]);
        this.Users = new DataSource([]);
        this.UserConnection = ko.observable({ Loading: true });
        this.Permissions = ko.observable(permissions);
        this.CurrentViewMode = ko.observable(TasklistViewMode.Standard);
        this.User = ko.observable(user);
        this.TasklistViewModeClass = ko.computed(function () {
            if (this.CurrentViewMode() == TasklistViewMode.Calendar)
                return 'calendar';
            if (this.CurrentViewMode() == TasklistViewMode.Wide)
                return 'wide';
            return '';
        }, this);
        this.RefreshTasklistData(data);
        this.RefreshPendingsData({});
        this.RefreshGroupsData({});
        this.Users.SetOrder({ Online: false, UserLogin: true, ApprovalGroup: true });
        this.Users.FilterTextColumns(['UserLogin', 'FullName', 'ApprovalGroup']);
        if (environmentData.currentUser.ExternalUser)
            this.Users.AddFilter('ExternalUserFilter', 'ExternalUser', [true]);
        else
            this.Users.AddFilter('ExternalUserFilter', 'ExternalUser', [false, null]);
        taskrow.ListUsers((function (users) {
            if (environmentData.currentUser.ExternalUser)
                users = _.filter(users, function (u) { return u.UserID == environmentData.currentUserID; });
            this.Users.RefreshData(users);
        }).bind(this));
        taskrow.ObserveUsersList(this.UserListObserver);
    }
    TaskCentralViewModel.prototype.ChangeViewMode = function (viewMode, basicFilter) {
        if (viewMode != TasklistViewMode.Recents) {
            this.RecentTasks.Filters.FilterSettings.ClearFilters();
            $('#recenttasks-filters > div').hide();
        }
        if (viewMode == TasklistViewMode.Recents) {
            this.Tasklist.Filters.FilterSettings.ClearFilters();
            $('#tasklist-filters > div').hide();
        }
        if (basicFilter)
            this.Tasklist.Filters.FilterSettings.BasicFilter(basicFilter);
        this.CurrentViewMode(viewMode);
    };
    TaskCentralViewModel.prototype.ToggleExternalUsers = function () {
        if (environmentData.currentUser.ExternalUser)
            return;
        if (this.Users.Filters()['ExternalUserFilter'])
            this.Users.RemoveFilter('ExternalUserFilter');
        else
            this.Users.AddFilter('ExternalUserFilter', 'ExternalUser', [false, null]);
    };
    TaskCentralViewModel.prototype.Unload = function () {
        taskrow.RemoveObserveUsersList(this.UserListObserver);
    };
    TaskCentralViewModel.prototype.UserListObserver = function (users) {
        if (taskrow.HasFocus) {
            if (this.nextData)
                users = this.nextData;
            this.nextData = null;
            if (users && users.length) {
                this.Users.RefreshData(users);
                if (taskrow.currentModule.currentUser && taskrow.currentModule.currentUser.serverData) {
                    $('#teamList li[data-userid=' + taskrow.currentModule.currentUser.serverData.User.UserID + ']').addClass('active');
                }
            }
        }
        else {
            this.nextData = users;
            $(window).unbind('focus', this.UserListObserver);
            $(window).one('focus', this.UserListObserver);
        }
    };
    TaskCentralViewModel.prototype.RefreshTasklistData = function (newData) {
        this.Tasklist.RefreshData(newData);
    };
    TaskCentralViewModel.prototype.RefreshRecentTasksData = function (newData) {
        this.RecentTasks.RefreshData(newData);
    };
    TaskCentralViewModel.prototype.RefreshPendingsData = function (newData) {
        this.Pendings.RefreshData(newData);
    };
    TaskCentralViewModel.prototype.RefreshGroupsData = function (data) {
        this.Groups.RefreshData(data);
        this.Groups.RecursionProperty = 'Groups';
    };
    return TaskCentralViewModel;
}());
var PendingsPartialModel = /** @class */ (function () {
    function PendingsPartialModel(data) {
        this.RefreshObservers = [];
        this.RefreshTimeout = null;
        this.PendingList = ko.observableArray([]);
        this.PendingList.subscribe(this.ListRefresh.bind(this));
        this.Notifications = ko.computed(function () {
            return _.filter(this.PendingList(), function (x) { return x.TypeID == -1; });
        }, this);
        this.TimesheetApprovals = ko.computed(function () {
            return _.filter(this.PendingList(), function (x) { return x.TypeID == EnumAppMainEntity.TimesheetEntry; });
        }, this);
        this.PendingExpenseApprovalsCount = ko.computed(function () {
            return _.filter(this.PendingList(), function (x) { return x.TypeID == EnumAppMainEntity.ExpenseEntry && !x.Reproved; }).length;
        }, this);
        this.ExpenseApprovals = ko.computed(function () {
            return _.filter(this.PendingList(), function (x) { return x.TypeID == EnumAppMainEntity.ExpenseEntry && x.Reproved == true; });
        }, this);
        this.JobApprovals = ko.computed(function () {
            return _.filter(this.PendingList(), function (x) { return x.TypeID == EnumAppMainEntity.Job; });
        }, this);
        this.BudgetApprovals = ko.computed(function () {
            return _.filter(this.PendingList(), function (x) { return x.TypeID == EnumAppMainEntity.Budget; });
        }, this);
        this.OvertimeAuthorizationApprovals = ko.computed(function () {
            return _.filter(this.PendingList(), function (x) { return x.TypeID == EnumAppMainEntity.OvertimeAuthorization; });
        }, this);
        this.FilterTypes = ko.observableArray([]);
        this.FilterTypesApplied = ko.computed(function () {
            return _.any(this.FilterTypes(), function (t) { return t.Selected(); });
        }, this);
        this.RefreshData(data);
    }
    PendingsPartialModel.prototype.ObserveRefresh = function (method) {
        this.RefreshObservers.push(method);
    };
    ;
    PendingsPartialModel.prototype.RefreshData = function (data) {
        //notifcações e pendencias de aprovações gerais
        var notifications = _.map(data.Notifications, function (notification) {
            return {
                TypeID: -1,
                CreationDate: notification.CreationDate,
                PendingNotificationID: notification.PendingNotificationID,
                Message: notification.NotificationText,
                UrlData: notification.UrlData || '',
                DeleteUrl: null,
                PendingTitle: notification.PendingTitle,
                ToUser: notification.ToUser,
                FromUser: notification.FromUser,
                NotificationTypeID: notification.PendingNotificationTypeID,
                CanDelete: notification.CanDelete
            };
        });
        var approvals = _.map(data.Approvals, function (approval) {
            return {
                TypeID: approval.AppMainEntityID,
                CreationDate: approval.CreationDate,
                Message: approval.Message,
                FromUserLogin: approval.FromUser.UserLogin,
                UrlData: approval.UrlData,
                DeleteUrl: null,
                PendingTitle: approval.PendingTitle,
                ToUser: approval.ToUser,
                FromUser: approval.FromUser,
                NotificationTypeID: null,
                Reproved: approval.Reproved
            };
        });
        var data2 = _.sortBy(_.union(notifications, approvals), 'CreationDate');
        this.PendingList(data2);
        this.RefreshFilters();
    };
    PendingsPartialModel.prototype.RefreshFilters = function () {
        this.FilterTypes.removeAll();
        this.FilterTypes.push({ Id: ko.observable(EnumTaskCentralPendingTypes.OvertimeAuthorization), Type: ko.observable(Resources.Timesheet.OvertimeAuthorization), Count: ko.observable(this.OvertimeAuthorizationApprovals().length), Selected: ko.observable(false) });
        this.FilterTypes.push({ Id: ko.observable(EnumTaskCentralPendingTypes.Expense), Type: ko.observable(Resources.Expense.Expenses), Count: ko.observable(this.PendingExpenseApprovalsCount()), Selected: ko.observable(false) });
        this.FilterTypes.push({ Id: ko.observable(EnumTaskCentralPendingTypes.Budget), Type: ko.observable(Resources.Job.Budget), Count: ko.observable(this.BudgetApprovals().length), Selected: ko.observable(false) });
        this.FilterTypes.push({ Id: ko.observable(EnumTaskCentralPendingTypes.Job), Type: ko.observable(Resources.Commons.Job), Count: ko.observable(this.JobApprovals().length), Selected: ko.observable(false) });
        this.FilterTypes.push({ Id: ko.observable(EnumTaskCentralPendingTypes.Notifications), Type: ko.observable(Resources.PendingApproval.Warnings), Count: ko.observable(this.Notifications().length), Selected: ko.observable(false) });
        this.FilterTypes.push({ Id: ko.observable(EnumTaskCentralPendingTypes.Timesheet), Type: ko.observable(Resources.Timesheet.TimesheetTitle), Count: ko.observable(this.TimesheetApprovals().length), Selected: ko.observable(false) });
    };
    PendingsPartialModel.prototype.CheckTypeSelected = function (type) {
        if (!this.FilterTypesApplied())
            return true;
        var filterType = _.filter(this.FilterTypes(), function (t) { return t.Id() == type; })[0];
        if (filterType)
            return filterType.Selected();
        return false;
    };
    PendingsPartialModel.prototype.ListRefresh = function () {
        if (this.RefreshTimeout) {
            clearTimeout(this.RefreshTimeout);
            this.RefreshTimeout = null;
        }
        this.RefreshTimeout = setTimeout((function () {
            this.RefreshTimeout = null;
            for (var i = 0; i < this.RefreshObservers.length; i++)
                this.RefreshObservers[i]();
        }).bind(this), 200);
        setTimeout(function () {
            $('#pendingList').jsScroll();
        }, 300);
    };
    return PendingsPartialModel;
}());
var EnumTaskCentralPendingTypes;
(function (EnumTaskCentralPendingTypes) {
    EnumTaskCentralPendingTypes[EnumTaskCentralPendingTypes["OvertimeAuthorization"] = 1] = "OvertimeAuthorization";
    EnumTaskCentralPendingTypes[EnumTaskCentralPendingTypes["Expense"] = 2] = "Expense";
    EnumTaskCentralPendingTypes[EnumTaskCentralPendingTypes["Budget"] = 3] = "Budget";
    EnumTaskCentralPendingTypes[EnumTaskCentralPendingTypes["Job"] = 4] = "Job";
    EnumTaskCentralPendingTypes[EnumTaskCentralPendingTypes["Notifications"] = 5] = "Notifications";
    EnumTaskCentralPendingTypes[EnumTaskCentralPendingTypes["Timesheet"] = 6] = "Timesheet";
})(EnumTaskCentralPendingTypes || (EnumTaskCentralPendingTypes = {}));
var TasklistPartialModel = /** @class */ (function () {
    function TasklistPartialModel(data) {
        var _this = this;
        //Other Vars
        this.RefreshTimeout = null;
        this.RefreshObservers = [];
        this.selectedGroupIndexStorageKey = "TaskCentralSelectedGroupIndex";
        //Tasklists
        this.OwnedTasks = ko.observableArray([]);
        this.DelegatedTasks = ko.observableArray([]);
        this.ParticipatedTasks = ko.observableArray([]);
        this.ReturnedTasks = ko.observableArray([]);
        this.InternalRequests = ko.observableArray([]);
        this.ExternalRequests = ko.observableArray([]);
        //Observables
        this.ViewMode = ko.observable(0);
        this.SelectedGroupIndex = ko.observable(this.ReadStorageSelectedGroupIndex());
        this.SelectedFields = ko.observable({});
        //Other Properties
        //this.Filters = new TasklistFilterSettings();
        this.Filters = new TasklistFilter();
        //Computeds
        this.UnreadTasksCount = ko.computed(function () {
            var list = _.chain(this.GetAllLists()).map(function (x) { return x(); }).union().flatten().value();
            var count = _.where(list, { 'MustRead': true }).length;
            //environmentData.UnreadTasksCount(count); //Movido para fora das viewmodels
            //console.log(['TaskCentral - UnreadTasksCount', count]);
            return count;
        }, this);
        this.HasTasks = ko.computed(function () {
            return _.chain(this.GetAllLists()).map(function (x) { return x().length > 0; }).any();
            //return (this.OwnedTasks().length > 0 || this.DelegatedTasks().length > 0 || this.ParticipatedTasks().length > 0);
        }, this);
        //Refresh filters
        this.Filters.FilterSettings.Refresh(this.GetAllLists().map(function (x) { return x(); }));
        this.ExternalRequestsTaskGroup = new TasklistGroup(this.Filters.FilterSettings, Resources.Task.ExternalRequests, this.ExternalRequests, /* periods */ true, /* my */ false, TaskListType.ExternalRequests, /* expansible */ false, 'icon-globe');
        this.ReturnedTasksGroup = new TasklistGroup(this.Filters.FilterSettings, Resources.Task.ReturnedTasks, this.ReturnedTasks, /* periods */ true, /* my */ true, TaskListType.ReturnedTasks, /* expansible */ false, 'icon-mail-reply');
        this.OwnedTasksGroup = new TasklistGroup(this.Filters.FilterSettings, Resources.Task.OwnedTasks, this.OwnedTasks, /* periods */ true, /* my */ true, TaskListType.OwnedTasks, /* expansible */ false, 'icon-mail-inbox');
        this.DelegatedTasksGroup = new TasklistGroup(this.Filters.FilterSettings, Resources.Task.DelegatedTasks, this.DelegatedTasks, /* periods */ true, /* my */ false, TaskListType.DelegatedTasks, /* expansible */ false, 'icon-arrow-right');
        this.ParticipatedTasksGroup = new TasklistGroup(this.Filters.FilterSettings, Resources.Task.ParticipatedTasks, this.ParticipatedTasks, /* periods */ true, /* my */ false, TaskListType.ParticipatedTasks, /* expansible */ false, 'icon-link');
        this.MyInternalRequestsGroup = new TasklistGroup(this.Filters.FilterSettings, Resources.Task.MyInternalRequests, this.InternalRequests, /* periods */ true, /* my */ false, TaskListType.InternalRequests, /* expansible */ false, 'icon-wrench');
        this.GetAllGroups().forEach(function (list) { return list.Subscribe(_this.ListRefresh.bind(_this)); });
        this.AllTaskLists = ko.computed(function () {
            return this.GetAllGroups();
        }, this);
        this.SelectedGroupTitle = ko.computed(function () {
            return this.AllTaskLists()[this.SelectedGroupIndex()].Title;
        }, this);
        this.SelectedGroupIndex.subscribe((function (index) {
            this.ListRefresh();
            this.WriteStorageSelectedGroupIndex();
        }).bind(this));
        this.Filters.FilterSettings.SingleGroup.subscribe((function () {
            this.ListRefresh();
        }).bind(this));
        //Calendar
        this.CalendarTaskGroups = [
            { title: Resources.Task.ExternalRequests, pos: 0 },
            { title: Resources.Task.OwnedTasks, pos: 1 },
            { title: Resources.Task.DelegatedTasks, pos: 2 },
            { title: Resources.Task.ParticipatedTasks, pos: 3 },
            { title: Resources.Task.ReturnedTasks, pos: 4 }
            //{ title: Resources.Task.MyInternalRequests, enabled: ko.observable(true) }
        ];
        this.CalendarSelectedGroup = ko.observable(0);
        this.CalendarTasks = ko.computed(function () {
            var dtNow = $M(null, true);
            var tasks = [
                this.CalendarSelectedGroup() == 0 ? _.sortBy(this.ExternalRequestsTaskGroup.List(), function (x) { return $M(x.DueDate).toDate().getTime(); }) : [],
                this.CalendarSelectedGroup() == 1 ? _.sortBy(this.OwnedTasksGroup.List(), function (x) { return $M(x.DueDate).toDate().getTime(); }) : [],
                this.CalendarSelectedGroup() == 2 ? _.sortBy(this.DelegatedTasksGroup.List(), function (x) { return $M(x.DueDate).toDate().getTime(); }) : [],
                this.CalendarSelectedGroup() == 3 ? _.sortBy(this.ParticipatedTasksGroup.List(), function (x) { return $M(x.DueDate).toDate().getTime(); }) : [],
                this.CalendarSelectedGroup() == 4 ? _.sortBy(this.ReturnedTasksGroup.List(), function (x) { return $M(x.DueDate).toDate().getTime(); }) : []
            ];
            var maxDates = [
                tasks[0].length ? $M(_.last(tasks[0]).DueDate, true) : dtNow,
                tasks[1].length ? $M(_.last(tasks[1]).DueDate, true) : dtNow,
                tasks[2].length ? $M(_.last(tasks[2]).DueDate, true) : dtNow,
                tasks[3].length ? $M(_.last(tasks[3]).DueDate, true) : dtNow,
                tasks[4].length ? $M(_.last(tasks[4]).DueDate, true) : dtNow
                //tasks[4].length ? $M(_.last(tasks[4]).DueDate, true) : dtNow
            ];
            var maxDate = _.max(maxDates);
            var minDate = dtNow.clone().add(-((6 + dtNow.day()) % 7), 'days').startOfDay();
            maxDate.add(7 - maxDate.day(), 'days').startOfDay();
            maxDate.add(Math.max(28 - maxDate.diff(minDate, 'days'), 0), 'days').startOfDay();
            var weeks = [];
            var monday = minDate.clone();
            var firstWeek = true;
            var indexes = [0, 0, 0, 0, 0];
            var taskStyles = ['owned', 'owned', 'delegated', 'participated', 'returned'];
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
                                URL: URLs.BuildUrl(task.UrlData, 'ownedTask'),
                                title: task.Title,
                                taskStyle: taskStyles[iGroup],
                                UserID: task.DisplayUserID,
                                UserLogin: task.DisplayUserLogin,
                                UserHashCode: task.DisplayUserHashCode,
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
        }, this);
        this.RefreshData(data);
    }
    TasklistPartialModel.prototype.GetAllLists = function () {
        return [this.OwnedTasks, this.DelegatedTasks, this.ParticipatedTasks, this.ReturnedTasks, this.InternalRequests, this.ExternalRequests];
    };
    TasklistPartialModel.prototype.GetAllGroups = function () {
        return [this.ExternalRequestsTaskGroup, this.ReturnedTasksGroup, this.OwnedTasksGroup, this.DelegatedTasksGroup, this.ParticipatedTasksGroup, this.MyInternalRequestsGroup];
    };
    TasklistPartialModel.prototype.ObserveRefresh = function (method) {
        this.RefreshObservers.push(method);
    };
    TasklistPartialModel.prototype.ForceListRefresh = function () {
        _(this.GetAllLists()).each(function (x) { return x.notifySubscribers(); });
    };
    TasklistPartialModel.prototype.ApplySettings = function (settings) {
        this.SelectedFields(_(settings.Fields).chain().map(function (x) { return [x.Value(), x.Selected()]; }).object().value());
        this.Filters.FilterSettings.SingleGroup(settings.SingleGroup());
        this.Filters.FilterSettings.SortBy(settings.SortBy());
        this.Filters.FilterSettings.ShowThirdUsersSubtasks(settings.ShowThirdUsersSubtasks());
    };
    TasklistPartialModel.prototype.EnsureUnreadTasksFilter = function () {
        if (this.Filters.FilterSettings.BasicFilter() == '1' && !_(this.GetAllLists()).any(function (x) { return _(x()).any(function (task) { return task.MustRead; }); }))
            this.Filters.FilterSettings.BasicFilter('0');
        if (this.Filters.FilterSettings.BasicFilter() == '2' && !_(this.GetAllLists()).any(function (x) { return _(x()).any(function (task) { return task.Favorite; }); }))
            this.Filters.FilterSettings.BasicFilter('0');
    };
    TasklistPartialModel.prototype.ExtendListProperties = function (list, displayDueDate) {
        return _.map(list, function (item) {
            var extendProperties = {
                DisplayDueDate: (displayDueDate ? true : false)
            };
            item = _.extend(item, extendProperties);
            if (!item.ReadByMe || typeof (item.ReadByMe) != 'function') {
                var extendProperties2 = {
                    _extendedProps: true,
                    Mine: (item.OwnerUserID == environmentData.currentUserID),
                    UnreadByMe: ko.observable(!!(item.MustRead)),
                    ReadByMe: ko.observable(!(item.MustRead)),
                    FavoriteMark: ko.observable(!!(item.Favorite)),
                    ExternalPending: ko.observable(!!(item.ExternalPending))
                };
                item = _.extend(item, extendProperties2);
            }
            //Load Tag Colors
            item.TagList = ko.observableArray([]);
            if (item.TagListString && item.TagListString.length != '') {
                var tags = item.TagListString.split(',');
                _.each(tags, function (tag) {
                    var tagParts = tag.split('|');
                    var tagTitle = tagParts[0];
                    var colorCss = 'badge-color';
                    if (tagParts.length > 1 && tagParts[1] && tagParts[1].length > 0)
                        colorCss += tagParts[1];
                    var newTag = { TagTitle: ko.observable(tagTitle), ColorCss: ko.observable(colorCss) };
                    item.TagList.push(newTag);
                });
            }
            return item;
        });
    };
    TasklistPartialModel.prototype.RefreshData = function (newData) {
        if (!newData.TaskList)
            return;
        //Setup observable throtling
        this.GetAllLists().map(function (x) { return x.extend({ rateLimit: 300 }); });
        //Check extranet feeature
        var extranetEnabled = environmentData.Permissions.Extranet;
        //Build lists
        this.ReturnedTasks(this.ExtendListProperties(_.filter(newData.TaskList.OwnedTasks, function (task) { return (extranetEnabled && task.ExternalRequest) ? false : task.CreationUserID == environmentData.currentUserID && task.ForwardUserID != environmentData.currentUserID; }), false));
        this.OwnedTasks(this.ExtendListProperties(_.filter(newData.TaskList.OwnedTasks, function (task) { return (extranetEnabled && task.ExternalRequest) ? false : task.CreationUserID != environmentData.currentUserID || task.ForwardUserID == environmentData.currentUserID; }), true));
        this.DelegatedTasks(this.ExtendListProperties(_.filter(newData.TaskList.DelegatedTasks, function (task) { return (extranetEnabled && task.ExternalRequest) ? false : task.JobTypeID != JobType.SuporteInterno; }), true));
        this.ParticipatedTasks(this.ExtendListProperties(_.filter(newData.TaskList.ParticipatedTasks, function (task) { return !(extranetEnabled && task.ExternalRequest); }), true));
        this.InternalRequests(this.ExtendListProperties(_.filter(newData.TaskList.DelegatedTasks, function (task) { return (extranetEnabled && task.ExternalRequest) ? false : task.JobTypeID == JobType.SuporteInterno; }), true));
        this.ExternalRequests(this.ExtendListProperties(_.filter(_.union(newData.TaskList.DelegatedTasks, newData.TaskList.OwnedTasks, newData.TaskList.ParticipatedTasks), function (task) { return extranetEnabled && !!(task.ExternalRequest); }), true));
        //Notify
        this.GetAllLists().forEach(function (x) { return x.notifySubscribers(); });
        this.EnsureUnreadTasksFilter();
        this.Filters.FilterSettings.Refresh.apply(this.Filters.FilterSettings, this.GetAllLists().map(function (x) { return x(); }));
        //alterar lista selecionada caso a mesma não possua tarefas
        //setTimeout((function () {
        //    if (this.AllTaskLists()[this.SelectedGroupIndex()].OriginalList().length == 0) {
        //        var allLists = this.AllTaskLists();
        //        for (var i = 0; i < allLists.length; i++) {
        //            if (allLists[i].OriginalList().length > 0) {
        //                this.SelectedGroupIndex(i);
        //                break;
        //            }
        //            else if (i == allLists.length - 1) {
        //                this.SelectedGroupIndex(2);
        //            }
        //        }
        //    }
        //}).bind(this), 100);
    };
    TasklistPartialModel.prototype.ListRefresh = function () {
        if (this.RefreshTimeout) {
            clearTimeout(this.RefreshTimeout);
            this.RefreshTimeout = null;
        }
        this.RefreshTimeout = setTimeout((function () {
            this.RefreshTimeout = null;
            for (var i = 0; i < this.RefreshObservers.length; i++)
                this.RefreshObservers[i]();
        }).bind(this), 200);
        setTimeout(function () {
            $('#tasklist').jsScroll();
        }, 300);
    };
    TasklistPartialModel.prototype.ReadStorageSelectedGroupIndex = function () {
        var index = LocalStorage.Get(this.selectedGroupIndexStorageKey) || 0;
        return index;
    };
    TasklistPartialModel.prototype.WriteStorageSelectedGroupIndex = function () {
        LocalStorage.Set(this.selectedGroupIndexStorageKey, this.SelectedGroupIndex());
    };
    return TasklistPartialModel;
}());
var RecentTasksPartialModel = /** @class */ (function () {
    function RecentTasksPartialModel(data) {
        //Other Vars
        this.RefreshTimeout = null;
        this.RefreshObservers = [];
        this.Loaded = ko.observable(false);
        //Tasklists
        this.RecentTasks = ko.observableArray([]);
        //Observables
        this.SelectedFields = ko.observable({});
        //Other Properties
        //this.Filters = new TasklistFilterSettings();
        this.Filters = new TasklistFilter();
        //Computeds
        this.UnreadTasksCount = ko.computed(function () {
            var list = _.chain(this.RecentTasks()).union().flatten().value();
            var count = _.filter(list, function (x) { return x.UnreadByMe(); }).length;
            return count;
        }, this);
        //Refresh filters
        this.Filters.FilterSettings.Refresh(this.RecentTasks());
        this.RecentTasksGroup = new RecentTasksGroup(this.Filters.FilterSettings, 'Recentes', this.RecentTasks, '');
        this.RecentTasksGroup.Subscribe(this.ListRefresh.bind(this));
        this.Filters.FilterSettings.SingleGroup.subscribe((function () {
            this.ListRefresh();
        }).bind(this));
        if (data)
            this.RefreshData(data);
    }
    RecentTasksPartialModel.prototype.ObserveRefresh = function (method) {
        this.RefreshObservers.push(method);
    };
    RecentTasksPartialModel.prototype.ForceListRefresh = function () {
        this.RecentTasks.notifySubscribers();
    };
    RecentTasksPartialModel.prototype.ApplySettings = function (settings) {
        this.SelectedFields(_(settings.Fields).chain().map(function (x) { return [x.Value(), x.Selected()]; }).object().value());
        this.Filters.FilterSettings.SingleGroup(settings.SingleGroup());
        this.Filters.FilterSettings.SortBy(settings.SortBy());
        this.Filters.FilterSettings.ShowThirdUsersSubtasks(settings.ShowThirdUsersSubtasks());
    };
    RecentTasksPartialModel.prototype.ExtendListProperties = function (list) {
        return _.map(list, function (item) {
            if (!item.ReadByMe || typeof (item.ReadByMe) != 'function') {
                var extendProperties2 = {
                    _extendedProps: true,
                    Mine: (item.OwnerUserID == environmentData.currentUserID),
                    UnreadByMe: ko.observable(!!(item.MustRead)),
                    ReadByMe: ko.observable(!(item.MustRead)),
                    FavoriteMark: ko.observable(!!(item.Favorite)),
                    ExternalPending: ko.observable(!!(item.ExternalPending))
                };
                item = _.extend(item, extendProperties2);
            }
            //Load Tag Colors
            item.TagList = ko.observableArray([]);
            if (item.TagListString && item.TagListString.length > 0) {
                var tags = item.TagListString.split(',');
                _.each(tags, function (tag) {
                    var tagParts = tag.split('|');
                    var tagTitle = tagParts[0];
                    var colorCss = 'badge-color';
                    if (tagParts.length > 1 && tagParts[1] && tagParts[1].length > 0)
                        colorCss += tagParts[1];
                    var newTag = { TagTitle: ko.observable(tagTitle), ColorCss: ko.observable(colorCss) };
                    item.TagList.push(newTag);
                });
            }
            return item;
        });
    };
    RecentTasksPartialModel.prototype.RefreshData = function (data) {
        this.Loaded(true);
        if (!data.RecentTasks)
            return;
        //Setup observable throtling
        this.RecentTasks.extend({ rateLimit: 300 });
        //Check extranet feeature
        var extranetEnabled = environmentData.Permissions.Extranet;
        //Build lists
        this.RecentTasks(this.ExtendListProperties(data.RecentTasks));
        //Notify
        this.RecentTasks.notifySubscribers();
        this.Filters.FilterSettings.Refresh.apply(this.Filters.FilterSettings, this.RecentTasks());
    };
    RecentTasksPartialModel.prototype.ListRefresh = function () {
        if (this.RefreshTimeout) {
            clearTimeout(this.RefreshTimeout);
            this.RefreshTimeout = null;
        }
        this.RefreshTimeout = setTimeout((function () {
            this.RefreshTimeout = null;
            for (var i = 0; i < this.RefreshObservers.length; i++)
                this.RefreshObservers[i]();
        }).bind(this), 200);
        setTimeout(function () {
            $('#recentTasksList').jsScroll();
        }, 300);
    };
    return RecentTasksPartialModel;
}());
var TasklistFilter = /** @class */ (function () {
    function TasklistFilter(filters) {
        this.FilterSettings = new TasklistFilterSettings();
        if (filters) {
            //console.log(['filters', ko.toJS(filters)]);
            this.FilterSettings = filters;
        }
    }
    TasklistFilter.prototype.FilterTask = function (task) {
        var self = this;
        //console.log(['this', this, 'this.FilterSettings', this.FilterSettings]);
        //retirar tasks que não devem ser exibidas
        if (ko.utils.arrayIndexOf(self.FilterSettings.ExcludeTaskIds(), task.TaskID) > -1)
            return false;
        //Somente não lidas
        var onlyUnread = self.FilterSettings.BasicFilter() == '1';
        var onlyFavorite = self.FilterSettings.BasicFilter() == '2';
        if (onlyUnread && !task.MustRead)
            return false;
        if (onlyFavorite && !task.Favorite)
            return false;
        //Não lidas, só exibem as tasks que são "minhas"
        //if (onlyUnread && task.OwnerUserID != environmentData.currentUserID)
        //    return false;
        //Titulo
        if (self.FilterSettings.FilterText() != ''
            && task.Title.toLowerCase().indexOf(self.FilterSettings.FilterText().toLowerCase()) == -1
            && task.TaskNumber.toString().toLowerCase().indexOf(self.FilterSettings.FilterText().toLowerCase()) == -1
            && task.ClientNickName.toLowerCase().indexOf(self.FilterSettings.FilterText().toLowerCase()) == -1
            && task.JobNumber.toString().toLowerCase().indexOf(self.FilterSettings.FilterText().toLowerCase()) == -1
            && task.JobTitle.toLowerCase().indexOf(self.FilterSettings.FilterText().toLowerCase()) == -1)
            return false;
        //Filtro cliente
        var clients = self.FilterSettings.SelectedClients();
        if (clients.length > 0 && !_.some(clients, function (client) { return client.Value() == task.ClientNickName; }))
            return false;
        //Filtro tipo de projeto
        var jobTypes = self.FilterSettings.SelectedJobTypes();
        if (jobTypes.length > 0 && !_.some(jobTypes, function (jobType) { return jobType.Value() == task.JobTypeID; }))
            return false;
        //Filtro projetos
        var jobs = self.FilterSettings.SelectedJobs();
        if (jobs.length > 0 && !_.some(jobs, function (job) { return job.Value() == task.JobNumber; }))
            return false;
        //Filtro usuarios
        var users = self.FilterSettings.SelectedUsers();
        if (users.length > 0 && !_.some(users, function (user) { return user.Value() == task.DisplayUserID; }))
            return false;
        var client = self.FilterSettings.FilterClient();
        if (client != '' && task.ClientNickName.toString() != client.substr(1))
            return false;
        var job = self.FilterSettings.FilterJob();
        if (job != '' && task.JobNumber.toString() != job.substr(1))
            return false;
        if (!this.FilterSettings.ShowThirdUsersSubtasks() && task.ParentTaskID && task.OwnerUserID != environmentData.currentUserID && !task.MustRead)
            return false;
        return true;
    };
    return TasklistFilter;
}());
var RecentTasksGroup = /** @class */ (function () {
    function RecentTasksGroup(filters, title, originalList, iconClass) {
        this.notificationTimeout = 0;
        this.subscribers = [];
        this.Filters = new TasklistFilter(filters);
        this.Title = ko.observable(title);
        this.OriginalList = originalList;
        this.IconClass = iconClass;
        this.List = ko.computed(function () {
            var data = this.OriginalList();
            //this.NotifySubscribers();
            var ret = _(data).filter(this.Filters.FilterTask.bind(this.Filters));
            return _.sortBy(ret, function (x) { return -$M(x.LastItem.Date).toDate().getTime(); });
        }, this).extend({ throttle: 50 });
        this.UnreadByMeCount = ko.computed(function () {
            return _.filter(this.List(), function (x) { return x.UnreadByMe(); }).length;
        }, this);
        this.FirstUnreadTaskNumber = ko.computed(function () {
            var task = _.filter(this.List(), function (x) { return x.UnreadByMe(); })[0];
            if (task)
                return task.TaskNumber;
            return 0;
        }, this);
    }
    RecentTasksGroup.prototype.NotifySubscribers = function () {
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = 0;
        }
        this.notificationTimeout = setTimeout((function () {
            this.notificationTimeout = 0;
            //console.log(this.subscribers.length);
            for (var i = 0; i < this.subscribers.length; i++) {
                this.subscribers[i]();
            }
        }).bind(this), 100);
    };
    RecentTasksGroup.prototype.Subscribe = function (listener) {
        this.List.subscribe(listener);
    };
    return RecentTasksGroup;
}());
var TasklistGroup = /** @class */ (function () {
    function TasklistGroup(filters, title, originalList, groupByPeriods, myTasks, listType, collapsible, iconClass) {
        this.taskDuedateIntervals = [0, 3, 7];
        this.notificationTimeout = 0;
        this.subscribers = [];
        var maxItems = 15;
        this.Filters = new TasklistFilter(filters);
        this.Title = ko.observable(title);
        this.OriginalList = originalList;
        this.MyTasks = myTasks;
        this.Type = listType;
        this.GroupByPeriods = groupByPeriods;
        this.Collapsible = ko.observable(!!collapsible);
        this.Expanded = ko.observable(false);
        this.IconClass = iconClass;
        this.dueDateSorter = function (t1, t2) {
            var due1 = $M(t1.DueDate);
            var due2 = $M(t2.DueDate);
            var dueDiff = due1.diff(due2);
            var orderDiff = t1.DueDateOrder - t2.DueDateOrder;
            if (dueDiff > 0)
                return 1;
            else if (dueDiff < 0)
                return -1;
            else if (orderDiff > 0)
                return 1;
            else if (orderDiff < 0)
                return -1;
            return 0;
        };
        this.pipelineStepSorter = function (t1, t2) {
            var ppStepDiff = t1.PipelineStepOrder - t2.PipelineStepOrder;
            if (ppStepDiff > 0)
                return 1;
            else if (ppStepDiff < 0)
                return -1;
            ppStepDiff = t1.PipelineStepID - t2.PipelineStepID;
            if (ppStepDiff > 0)
                return -1;
            else if (ppStepDiff < 0)
                return 1;
            var due1 = $M(t1.DueDate);
            var due2 = $M(t2.DueDate);
            var dueDiff = due1.diff(due2);
            var orderDiff = t1.DueDateOrder - t2.DueDateOrder;
            if (dueDiff > 0)
                return 1;
            else if (dueDiff < 0)
                return -1;
            else if (orderDiff > 0)
                return 1;
            else if (orderDiff < 0)
                return -1;
            return 0;
        };
        this.List = ko.computed(function () {
            var data;
            if (this.Collapsible() && !this.Expanded())
                data = this.OriginalList.slice(0, maxItems);
            else
                data = this.OriginalList();
            //this.NotifySubscribers();
            var sorter = null;
            switch (this.Filters.FilterSettings.SortBy()) {
                case TasklistSortOptions.PipelineStepOrder:
                    sorter = this.pipelineStepSorter;
                    break;
                case TasklistSortOptions.DueDate:
                default:
                    sorter = this.dueDateSorter;
                    break;
            }
            var ret = _(data).filter(this.Filters.FilterTask.bind(this.Filters));
            ret.sort(sorter);
            ret = _.sortBy(ret, function (x) { return x.Closed; });
            return ret;
        }, this).extend({ throttle: 50 });
        this.UnreadByOwnerCount = ko.computed(function () {
            return _.where(this.List(), { "Read": false }).length;
        }, this);
        this.UnreadByMeCount = ko.computed(function () {
            return _.where(this.List(), { "MustRead": true }).length;
        }, this);
        this.FirstUnreadTaskNumber = ko.computed(function () {
            var task = _.where(this.List(), { "MustRead": true })[0];
            if (task)
                return task.TaskNumber;
            return 0;
        }, this);
        this.HasMore = ko.computed(function () {
            return this.Collapsible() && !this.Expanded() && this.OriginalList().length > (maxItems + 10);
        }, this);
    }
    TasklistGroup.prototype.GetDuedateInterval = function (dateString) {
        var date = $M(dateString, true);
        var today = $M(null, true);
        var diff = date.diff(today, 'days');
        for (var i = 0; i < this.taskDuedateIntervals.length; i++)
            if (diff <= this.taskDuedateIntervals[i])
                return this.taskDuedateIntervals[i];
        return -1;
    };
    TasklistGroup.prototype.GetNewPeriodLabel = function (index) {
        switch (this.Filters.FilterSettings.SortBy()) {
            case TasklistSortOptions.PipelineStepOrder:
                return this.List()[index].PipelineStepTitle || "";
            case TasklistSortOptions.DueDate:
            default:
                var interval = this.GetDuedateInterval(this.List()[index].DueDate);
                switch (interval) {
                    case 0: return Resources.Task.Interval_Today;
                    case 3: return Resources.Task.Interval_Next3Days;
                    case 7: return Resources.Task.Interval_NextWeek;
                    default: return Resources.Task.Interval_Future;
                }
        }
    };
    TasklistGroup.prototype.TestNewPeriod = function (index) {
        switch (this.Filters.FilterSettings.SortBy()) {
            case TasklistSortOptions.PipelineStepOrder:
                if (!this.GroupByPeriods)
                    return false;
                if (index == 0)
                    return true;
                return this.List()[index].PipelineStepID != this.List()[index - 1].PipelineStepID;
            case TasklistSortOptions.DueDate:
            default:
                if (!this.GroupByPeriods)
                    return false;
                if (index == 0)
                    return true;
                return this.GetDuedateInterval(this.List()[index].DueDate) != this.GetDuedateInterval(this.List()[index - 1].DueDate);
        }
    };
    TasklistGroup.prototype.NotifySubscribers = function () {
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = 0;
        }
        this.notificationTimeout = setTimeout((function () {
            this.notificationTimeout = 0;
            //console.log(this.subscribers.length);
            for (var i = 0; i < this.subscribers.length; i++) {
                this.subscribers[i]();
            }
        }).bind(this), 100);
    };
    TasklistGroup.prototype.Subscribe = function (listener) {
        //this.subscribers.push(listener);
        this.List.subscribe(listener);
    };
    return TasklistGroup;
}());
var TasklistSortOptions;
(function (TasklistSortOptions) {
    TasklistSortOptions[TasklistSortOptions["DueDate"] = 1] = "DueDate";
    TasklistSortOptions[TasklistSortOptions["PipelineStepOrder"] = 2] = "PipelineStepOrder";
})(TasklistSortOptions || (TasklistSortOptions = {}));
var TasklistFilterSettings = /** @class */ (function () {
    function TasklistFilterSettings() {
        //Filter settings
        //Lists
        this.ExcludeTaskIds = ko.observableArray([]);
        this.FilterClients = ko.observableArray([]);
        this.FilterJobTypes = ko.observableArray([]);
        //this.FilterJobs = ko.observableArray([]);
        this.FilterUsers = ko.observableArray([]);
        //Valuetypes
        this.BasicFilter = ko.observable('0');
        this.FilterText = ko.observable('');
        //this.FilterClientJob = ko.observable('');        
        this.FilterJob = ko.observable('');
        this.FilterClient = ko.observable('');
        this.FilterClient.subscribe(function () {
            this.FilterJob('');
        }.bind(this));
        this.SelectedTaskListGroup = ko.observable(null);
        //Behavior settings
        this.SortBy = ko.observable(TasklistSortOptions.DueDate);
        this.SingleGroup = ko.observable(false);
        this.ShowThirdUsersSubtasks = ko.observable(true);
        this.FilterJobs = ko.computed(function () {
            var filter = this.FilterClient();
            var clients = this.FilterClients();
            var filterText = filter == '' ? '' : filter.substr(1);
            if (filter == '')
                return [];
            var ret = _(clients).find(function (x) { return x.Value() == filterText; });
            if (ret)
                return ret['Jobs']();
            return [];
        }, this);
        //Computeds
        this.SelectedClients = ko.computed(function () {
            return _.filter(this.FilterClients(), function (client) { return client.Selected(); });
        }, this);
        this.SelectedJobTypes = ko.computed(function () {
            return _.filter(this.FilterJobTypes(), function (jobType) { return jobType.Selected(); });
        }, this);
        this.SelectedJobs = ko.computed(function () {
            return _.filter(this.FilterJobs(), function (job) { return job.Selected(); });
        }, this);
        this.SelectedUsers = ko.computed(function () {
            return _.filter(this.FilterUsers(), function (user) { return user.Selected(); });
        }, this);
        this.FilterClientText = ko.computed(function () {
            var filter = this.FilterClient();
            var clients = this.FilterClients();
            var filterText = filter == '' ? '' : filter.substr(1);
            if (filter == '')
                return Resources.Client.ClientTitle;
            var ret = _(clients).find(function (x) { return x.Value() == filterText; });
            if (ret)
                return ret.Text();
            return '';
        }, this);
        this.FilterJobText = ko.computed(function () {
            var filter = this.FilterJob();
            var jobs = this.FilterJobs();
            var filterText = filter == '' ? '' : filter.substr(1);
            if (filter == '')
                return Resources.Job.Title;
            var ret = _(jobs).find(function (x) { return x.Value() == parseInt(filterText, 10); });
            if (ret)
                return ret.Text();
            return '';
        }, this);
    }
    TasklistFilterSettings.prototype.ClearFilterText = function () {
        this.FilterText('');
    };
    TasklistFilterSettings.prototype.ClearFilterUsers = function () {
        //TODO: Otimização possível?
        _.forEach(this.FilterUsers(), function (user) { return user.Selected(false); });
    };
    TasklistFilterSettings.prototype.ClearFilterClientJob = function () {
        this.FilterClient('');
        this.FilterJob('');
    };
    TasklistFilterSettings.prototype.ClearFilters = function () {
        this.ClearFilterText();
        this.ClearFilterClientJob();
        this.ClearFilterUsers();
    };
    TasklistFilterSettings.prototype.Refresh = function () {
        var tasklists = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tasklists[_i] = arguments[_i];
        }
        var allTasks = _(tasklists).flatten(true);
        //Clients
        var clients = _.uniq(allTasks, false, function (task) {
            return task.ClientNickName;
        });
        var allJobs = _.uniq(allTasks, false, function (task) {
            return task.JobNumber;
        });
        clients = _.map(clients, function (task) {
            var ret = new DataItem(task.ClientDisplayName, task.ClientNickName, false);
            var clientJobs = _.map(_.where(allJobs, { "ClientID": task.ClientID }), function (task2) {
                return new DataItem(task2.JobTitle, task2.JobNumber, false);
            }).sort(function (a, b) { return Utils.Compare(a.Text(), b.Text()); });
            ret['Jobs'] = ko.observableArray(clientJobs);
            return ret;
        }).sort(function (a, b) { return Utils.Compare(a.Text(), b.Text()); });
        //Jobs
        var jobs = _.map(allJobs, function (task) {
            return new DataItem(task.JobTitle, task.JobNumber, false);
        });
        //Job types
        var jobTypes = _.uniq(allTasks, false, function (task) {
            return task.JobTypeID;
        });
        jobTypes = _.map(jobTypes, function (task) {
            return new DataItem(task.JobType, task.JobTypeID, false);
        });
        //Users
        var previousSelectedUsers = _.pluck(_.where(ko.toJS(this.FilterUsers()), { 'Selected': true }), 'Value');
        var users = _.map(_.uniq(allTasks, false, function (task) {
            return task.DisplayUserID;
        }), function (task) {
            var selected = _.indexOf(previousSelectedUsers, task.DisplayUserID) > -1;
            var ret = new DataItem(task.DisplayUserLogin, task.DisplayUserID, selected);
            ret.UserHashCode = task.DisplayUserHashCode;
            return ret;
        });
        this.FilterClients(clients);
        this.FilterJobTypes(jobTypes);
        //this.FilterJobs(jobs);
        this.FilterUsers(users);
    };
    return TasklistFilterSettings;
}());
var TaskCentralSettingsFields;
(function (TaskCentralSettingsFields) {
    TaskCentralSettingsFields[TaskCentralSettingsFields["TaskNumber"] = 1] = "TaskNumber";
    TaskCentralSettingsFields[TaskCentralSettingsFields["LastComment"] = 2] = "LastComment";
    TaskCentralSettingsFields[TaskCentralSettingsFields["Client"] = 3] = "Client";
    TaskCentralSettingsFields[TaskCentralSettingsFields["Job"] = 4] = "Job";
    TaskCentralSettingsFields[TaskCentralSettingsFields["TaskTags"] = 5] = "TaskTags";
})(TaskCentralSettingsFields || (TaskCentralSettingsFields = {}));
var TaskCentralSettingsViewModel = /** @class */ (function () {
    function TaskCentralSettingsViewModel() {
        var _this = this;
        this.storageKey = "TaskCentralSettings";
        this.defaultFields = [TaskCentralSettingsFields.TaskNumber, TaskCentralSettingsFields.Client, TaskCentralSettingsFields.Job];
        this.SingleGroup = ko.observable(false);
        this.SortBy = ko.observable(TasklistSortOptions.DueDate);
        this.ShowThirdUsersSubtasks = ko.observable(true);
        this.Fields = [
            new DataItem(Resources.Task.Settings_FieldsTaskNumber, TaskCentralSettingsFields.TaskNumber, false),
            new DataItem(Resources.Task.Settings_FieldsLastComment, TaskCentralSettingsFields.LastComment, false),
            new DataItem(Resources.Task.Settings_FieldsClient, TaskCentralSettingsFields.Client, false),
            new DataItem(Resources.Task.Settings_FieldsJob, TaskCentralSettingsFields.Job, false),
            new DataItem(Resources.Task.Settings_FieldsTaskTags, TaskCentralSettingsFields.TaskTags, false)
        ];
        this.Fields.forEach(function (x) { return x.Selected(_this.defaultFields.indexOf(x.Value()) > -1); });
    }
    TaskCentralSettingsViewModel.prototype.ReadStorageSettings = function () {
        var savedSettings = LocalStorage.Get(this.storageKey);
        if (savedSettings) {
            this.SingleGroup(savedSettings.SingleGroup);
            this.SortBy(savedSettings.SortBy);
            this.ShowThirdUsersSubtasks(savedSettings.ShowThirdUsersSubtasks);
            var selectedFields = savedSettings.SelectedFields || this.defaultFields;
            this.Fields.forEach(function (x) { return x.Selected(selectedFields.indexOf(x.Value()) > -1); });
        }
    };
    TaskCentralSettingsViewModel.prototype.WriteStorageSettings = function () {
        var settings = {
            SingleGroup: this.SingleGroup(),
            SortBy: this.SortBy(),
            ShowThirdUsersSubtasks: this.ShowThirdUsersSubtasks(),
            SelectedFields: this.Fields.filter(function (x) { return x.Selected(); }).map(function (x) { return x.Value(); }),
        };
        LocalStorage.Set(this.storageKey, settings);
    };
    TaskCentralSettingsViewModel.prototype.ResetToDefaults = function () {
        var _this = this;
        this.SingleGroup(false);
        this.SortBy(TasklistSortOptions.DueDate);
        this.ShowThirdUsersSubtasks(true);
        this.Fields.forEach(function (x) { return x.Selected(_this.defaultFields.indexOf(x.Value()) > -1); });
    };
    return TaskCentralSettingsViewModel;
}());
define(function () {
    return TaskCentral;
});
//# sourceMappingURL=TaskCentral.js.map