///<reference path="../../Main/App.ts"/>
///<reference path="ClientContact.ts"/>
///<reference path="ClientDetail.ts"/>
var ClientHome = /** @class */ (function () {
    function ClientHome() {
        this.clientHome = true;
        this.pendingImageVerifierInterval = 0;
        this.currentContainer = '';
        //#endregion Deliverable
    }
    ClientHome.prototype.CurrentSection = function () {
        return Section.Client;
    };
    ClientHome.prototype.CurrentContext = function () {
        return this._currentContext;
    };
    ClientHome.prototype.HasOwnMenu = function () {
        return true;
    };
    ClientHome.prototype.Setup = function (options) {
    };
    ClientHome.prototype.Action = function (options) {
        options = options || {};
        var self = this;
        //Define a ação complementar
        var sideAction = null;
        if (options.editClient) {
            sideAction = function () { self.EditClient(); };
        }
        else if (options.newContact) {
            sideAction = function () { self.NewContact(); };
        }
        else if (options.openContact) {
            sideAction = function () { self.OpenContact(options.contactID); };
        }
        else if (options.showContacts) {
            sideAction = function () { self.ShowContacts(); };
        }
        else if (options.newProduct) {
            sideAction = function () { self.NewProduct(); };
        }
        else if (options.openProduct) {
            sideAction = function () { self.OpenProduct(options.productID); };
        }
        else if (options.showProducts) {
            sideAction = function () { self.ShowProducts(); };
        }
        else if (options.showClientHome) {
            sideAction = function () { self.ShowClientHome(); };
        }
        //close edit client
        if (self.editClient) {
            self.ClearEditClient();
        }
        if (options.openClientHome && sideAction) {
            this.LoadClientHome(options.ClientNickName, function () {
                sideAction();
            });
        }
        else if (sideAction) {
            sideAction();
        }
        else {
            this.LoadClientHome(options.ClientNickName);
        }
    };
    ClientHome.prototype.Unload = function () {
        Utils.CleanNode($('#dashboard')[0]);
        if (this.searchBox)
            this.searchBox.Unload();
        $(window).unbind('resize', this.SetupListScroll);
        if (this.attachments)
            this.attachments.Destroy();
        clearInterval(this.pendingImageVerifierInterval);
    };
    ClientHome.prototype.SetData = function (data) {
        this.serverData = data;
        this.viewModel = new ClientHomeViewModel(data);
    };
    ClientHome.prototype.ShowContainer = function (containerID) {
        var $container = $('#' + containerID);
        $('.client-home-container').not('#' + containerID).fadeOut();
        if (this.currentContainer != containerID) {
            $('#' + containerID).fadeIn();
        }
        this.currentContainer = containerID;
    };
    ClientHome.prototype.ShowClientHome = function () {
        this.CloseContact();
        this.CloseProduct();
        this.ShowJobList();
    };
    ClientHome.prototype.ShowJobList = function () {
        var self = this;
        self.ShowContainer('jobListContainer');
        self.SetupListScroll();
    };
    ClientHome.prototype.SetupListScroll = function () {
        var $list = null;
        if (this.currentContainer == 'jobListContainer') {
            $('#contactListContainer').hide();
            $('#productListContainer').hide();
            $list = $('#joblist');
        }
        else if (this.currentContainer == 'contactListContainer') {
            $('#productListContainer').hide();
            $('#jobListContainer').hide();
            $list = $('#contactList');
        }
        else if (this.currentContainer == 'productListContainer') {
            $('#jobListContainer').hide();
            $('#contactListContainer').hide();
            $list = $('#productList');
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
        $list.scrollableAccordeon('refresh', true);
    };
    ClientHome.prototype.LoadClientHome = function (clientNickName, callback) {
        var mainContent = $('#main');
        var self = this;
        var template = 'Client/ClientHome', templateUrl = taskrow.templatePath + template, dataUrl = 'Client/ClientHome';
        $.ajax({
            url: dataUrl,
            data: { clientNickName: clientNickName },
            success: function (data, status) {
                if (data.Success === false) {
                    taskrow.FinishLoadModule();
                    UI.Alert(data.Message);
                    Navigation.GoBack();
                    return;
                }
                self.SetData(data);
                var clientUrl = JSON.parse(data.ClientHome.ClientData.UrlData);
                clientUrl.Type = 'client';
                Activity.RegisterClient({ clientNickName: data.ClientHome.ClientData.ClientNickName, displayName: data.ClientHome.ClientData.DisplayName, urlData: clientUrl });
                Utils.ChangeClientTab(data.ClientHome.ClientData.DisplayName, location.href);
                taskrow.LoadTemplate(templateUrl, function (getHTML) {
                    taskrow.FinishLoadModule();
                    mainContent.html(getHTML(data));
                    ko.applyBindings(self.viewModel, $('#dashboard')[0]);
                    self.pendingImageVerifierInterval = setInterval(function (x) { return x.VerifyPendingImages(); }, 5000, self);
                    self.SetupSearchBox(mainContent[0]);
                    self.SetupWallPost();
                    self.SetupMembersPopover();
                    $(window).addListener('resize', function () {
                        self.SetupListScroll.apply(self);
                    });
                    if (callback) {
                        callback();
                    }
                    else {
                        self.ShowJobList();
                    }
                });
                Menu.LoadMenu(Menus.ClientMenu(data));
            }
        });
    };
    ClientHome.prototype.SetupSearchBox = function (container) {
        var context = [];
        var clientURL = JSON.parse(this.serverData.ClientHome.ClientData.UrlData);
        clientURL.Type = 'client';
        context.push(new BreadcrumbItem(this.serverData.ClientHome.ClientData.DisplayName, URLs.BuildUrl(clientURL), 'clientID', this.serverData.ClientHome.ClientID));
        this._currentContext = context;
        var searchBox = $('#searchBox', container)[0];
        this.searchBox = new ContextSearch(searchBox, context);
        this.searchBox.Init();
    };
    ClientHome.prototype.SetupWallPost = function () {
        var self = this;
        this.wallPost = new WallPost($('#client_wall')[0], self.serverData.ClientWall);
        this.wallPost.clientNickName = this.serverData.ClientNickName;
        this.wallPost.Init();
    };
    ClientHome.prototype.SetupMembersPopover = function () {
        var self = this;
        var members = self.viewModel.ClientData().ClientMember;
        var ownerUserID = self.viewModel.ClientData().OwnerID;
        //quando possui apenas um, eh o owner e nao conta como participante
        if (members.length == 1 && members[0].UserID == ownerUserID)
            return null;
        Utils.SetupMembersPopover($('#client-members')[0], members, ownerUserID, true);
    };
    ClientHome.prototype.VerifyPendingImages = function () {
        if (Cookies.Get('pending_images')) {
            Cookies.Set('pending_images', null);
            _($(' .text-comment img, .newTaskItemComment img, #taskImagesThumbs img, .wall-post img')).filter(function (x) { return (x.src || '').toLowerCase().indexOf('file/') >= 0; }).map(function (item) { item.src += '&n=' + (new Date()).getTime(); });
        }
    };
    ClientHome.prototype.ToggleFilter = function (filterName) {
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
                        $('#joblist').css('margin-top', (tween.end - tween.now) + 'px');
                    else
                        $('#joblist').css('margin-top', null);
                }
            }
        };
        $('#clientJoblist-filters .filter-' + filterName).slideToggle(options);
    };
    //#region Tabs
    ClientHome.prototype.UnloadTabs = function () {
        var self = this;
        if (self.notes != null)
            self.notes.Destroy();
        if (self.attachments != null)
            self.attachments.Destroy();
    };
    ClientHome.prototype.LoadTabWall = function (elem) {
        this.UnloadTabs();
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        this.SelectTabs("tab-wall");
    };
    ClientHome.prototype.LoadTabNotes = function (elem) {
        this.UnloadTabs();
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        var self = this;
        var tabNotesContent = $('#client_notes');
        var template = 'Partials/Notes', templateUrl = taskrow.templatePath + template;
        require(['Scripts/Plugins/Notes'], function (ctor) {
            self.notes = new ctor();
            taskrow.LoadTemplate(templateUrl, function (getHTML) {
                tabNotesContent.html(getHTML({}));
                self.notes.Init("client_notes", EnumNoteType.Client, self.serverData.ClientHome.ClientID);
                self.SelectTabs("tab-notes");
            });
        });
    };
    ClientHome.prototype.LoadTabFiles = function (elem) {
        if (!this.serverData.Permissions.ViewClientAttachments)
            return false;
        this.UnloadTabs();
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        var self = this;
        var tabFilesContent = $('#client_files');
        var template = 'Partials/Attachments', templateUrl = taskrow.templatePath + template;
        taskrow.DisplayLoading();
        require(['Scripts/Plugins/Attachments'], function (ctor) {
            self.attachments = new ctor();
            self.attachments.clientNickName = self.serverData.ClientNickName;
            taskrow.LoadTemplate(templateUrl, function (getHTML) {
                tabFilesContent.html(getHTML({}));
                self.attachments.Init(tabFilesContent[0], EnumAttachmentsMode.Client);
                self.SelectTabs("tab-files");
                taskrow.HideLoading();
            });
        });
    };
    ClientHome.prototype.LoadTabAdminfo = function (elem) {
        this.UnloadTabs();
        //ativar tab
        $("#dashboard ul.nav-tabs li").removeClass("active");
        $(elem).parent().addClass('active');
        this.SelectTabs('tab-adminfo');
    };
    ClientHome.prototype.SelectTabs = function (tab) {
        $("#tab-content-detail .tab-pane").removeClass("active");
        $("#" + tab).addClass("active");
    };
    //#endregion Tabs
    //#region Edit Client
    ClientHome.prototype.EditClient = function () {
        var self = this;
        self.ShowJobList();
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Client/ClientDetail"], function (ctor) {
            self.currentClient = new ctor.EditClient();
            self.editClient = true;
            self.currentClient.Action({ clientData: self.serverData });
        });
    };
    ClientHome.prototype.ClearEditClient = function () {
        this.editClient = false;
        this.currentClient.Clear();
        this.currentClient = null;
        $('.client-detail').remove();
        $('.dashboard-content').show();
    };
    ClientHome.prototype.CloseDashboardEditClient = function () {
        this.ClearEditClient();
        var clientUrl = '#companies/' + this.serverData.ClientNickName;
        if (location.hash != clientUrl)
            location.href = clientUrl;
    };
    ClientHome.prototype.InactivateOrReactivateClient = function () {
        var self = this;
        if (!this.serverData.ClientHome.ClientData.Inactive && this.serverData.ClientHome.ClientData.HasOpenedJobs) {
            UI.Alert(Resources.Client.InactivateClientWithOpenedJobs);
            return false;
        }
        var fnInactivate = function () {
            taskrow.DisplayLoading();
            $.ajax({
                url: 'Client/InactivateOrReactivate',
                data: { clientNickName: self.serverData.ClientNickName },
                success: function (data, status) {
                    taskrow.HideLoading();
                    if (data.Success === false) {
                        UI.Alert(data.Message);
                        return;
                    }
                    var inactive = data.Entity.Inactive;
                    self.serverData.ClientHome.ClientData.Inactive = inactive;
                    self.viewModel.ClientData().Inactive = inactive;
                    self.viewModel.ClientData.valueHasMutated();
                }
            });
        };
        var confirmText = self.serverData.ClientHome.ClientData.Inactive ? Resources.Client.ConfirmReactivateClient : Resources.Client.ConfirmInactivateClient;
        UI.ConfirmYesNo(confirmText, fnInactivate);
    };
    //#endregion Edit Client
    //#region Contacts
    ClientHome.prototype.ShowContacts = function () {
        var self = this;
        self.ShowContainer('contactListContainer');
        self.SetupListScroll();
    };
    ClientHome.prototype.NewContact = function () {
        $('.client-home-container .nav-tabs').children('li').removeClass('active');
        this.OpenContact(null);
    };
    ClientHome.prototype.OpenContact = function (contactID) {
        var self = this;
        this.ShowContacts();
        if (contactID)
            $('#contactListContainer li[data-contactid=' + contactID + ']').addClass('active');
        var contactData = (!contactID) ?
            self.serverData.ClientContactModel :
            ko.utils.arrayFirst(self.viewModel.Contacts.OriginalData(), function (c) { return c.ClientContactID == contactID; });
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Client/ClientContact"], function (ctor) {
            if (self.currentContact)
                self.currentContact.Unload();
            self.currentContact = new ctor();
            self.currentContact.Init(self.serverData.ClientNickName, self.serverData.ClientAddress, contactData);
            self.contactOpen = true;
            self.currentContact.Show();
        });
    };
    ClientHome.prototype.ToggleInactiveContacts = function () {
        if (this.viewModel.Contacts.Filters()['InactiveFilter'])
            this.viewModel.Contacts.RemoveFilter('InactiveFilter');
        else
            this.viewModel.Contacts.AddFilter('InactiveFilter', 'Inactive', [false, null]);
    };
    ClientHome.prototype.CloseContact = function () {
        if (this.currentContact)
            this.currentContact.Unload();
        this.contactOpen = false;
        this.currentContact = null;
        $('.client-contacts').remove();
        $('.dashboard-content').show();
        $('#contactList').children('li').removeClass('active');
    };
    ClientHome.prototype.CloseDashboardContact = function () {
        this.CloseContact();
        var clientUrl = '#companies/' + this.serverData.ClientNickName + '/contacts';
        if (location.hash != clientUrl)
            location.href = clientUrl;
    };
    //#endregion Contacts
    //#region Product
    ClientHome.prototype.ShowProducts = function () {
        var self = this;
        self.ShowContainer('productListContainer');
        self.SetupListScroll();
    };
    ClientHome.prototype.NewProduct = function () {
        $('.client-home-container .nav-tabs').children('li').removeClass('active');
        this.OpenProduct();
    };
    ClientHome.prototype.OpenProduct = function (productID) {
        var self = this;
        this.ShowProducts();
        if (productID)
            $('#productListContainer li[data-productid=' + productID + ']').addClass('active');
        var productData = !productID ?
            this.serverData.ProductModel :
            ko.utils.arrayFirst(self.viewModel.ProductList.OriginalData(), function (d) { return d.ProductID == productID; });
        taskrow.DisplayLoading();
        require(["Scripts/ClientViews/Client/Product"], function (ctor) {
            if (self.currentProduct)
                self.currentProduct.Unload();
            self.currentProduct = new ctor();
            self.currentProduct.Init(self.serverData.ClientNickName, productData);
            self.productOpen = true;
            self.currentProduct.Show();
        });
    };
    ClientHome.prototype.ToggleInactiveProducts = function () {
        if (this.viewModel.ProductList.Filters()['InactiveFilter'])
            this.viewModel.ProductList.RemoveFilter('InactiveFilter');
        else
            this.viewModel.ProductList.AddFilter('InactiveFilter', 'Inactive', [false, null]);
    };
    ClientHome.prototype.CloseProduct = function () {
        if (this.currentProduct)
            this.currentProduct.Unload();
        this.productOpen = false;
        this.currentProduct = null;
        $('.client-products').remove();
        $('.dashboard-content').show();
        $('#productList').children('li').removeClass('active');
    };
    ClientHome.prototype.CloseDashboardProduct = function () {
        this.CloseProduct();
        var clientUrl = '#companies/' + this.serverData.ClientNickName + '/products';
        if (location.hash != clientUrl)
            location.href = clientUrl;
    };
    return ClientHome;
}());
function ClientHomeViewModel(data) {
    var self = this;
    var originalData = data;
    self.JobList = new JobListPartialModel(data);
    //self.ClientID = ko.observable(data.ClientHome.ClientID);
    //self.ClientNumber = ko.observable(data.ClientHome.ClientNumber);
    //self.ClientName = ko.observable(data.ClientHome.ClientName);
    //self.ClientNickName = ko.observable(data.ClientHome.ClientNickName);
    //self.DisplayName = ko.observable(data.ClientHome.DisplayName);
    self.ClientData = ko.observable(data.ClientHome.ClientData);
    self.Permissions = ko.observable(data.Permissions);
    self.Contacts = new DataSource([]);
    self.Contacts.SetOrder({ ContactName: true, ContactEmail: true });
    self.Contacts.FilterTextColumns(['ContactEmail', 'ContactName']);
    self.Contacts.AddFilter('InactiveFilter', 'Inactive', [false, null]);
    self.Contacts.RefreshData(data.ClientHome.Contacts);
    self.TestNewJobType = function (index) {
        var list = this.JobList.FilteredJobList();
        var previousItem = index == 0 ? null : list[index - 1];
        var item = list[index];
        if (!item.JobType && (index == 0 || !previousItem.JobType))
            return false;
        if (!item.JobType)
            return true;
        if (!previousItem || !previousItem.JobType || previousItem.JobTypeID != item.JobTypeID)
            return true;
        return false;
    };
    self.ProductList = new DataSource([]);
    self.ProductList.SetOrder({ Name: true });
    self.ProductList.FilterTextColumns(['Name', 'ExternalCode']);
    self.ProductList.AddFilter('InactiveFilter', 'Inactive', [false, null]);
    self.ProductList.RefreshData(data.ClientHome.ProductList);
}
function JobListPartialModel(data) {
    var self = this;
    self.AllJobs = ko.observableArray(data.ClientHome.Jobs);
    var filter = function (jobTypes, jobStatus) {
        var ret = ko.utils.arrayFilter(self.AllJobs(), function (job) {
            if (jobTypes.length > 0 && !_.contains(jobTypes, job.JobTypeID))
                return false;
            if (jobStatus.length > 0 && !_.contains(jobStatus, job.JobStatusID))
                return false;
            return true;
        });
        return ko.computed(function () {
            return ret;
        }, self);
    };
    //Categorias de jobs    
    self.OpenProjects = filter([2], [4, 3, 1]);
    self.OpenAccounts = filter([3], [4, 3, 1]);
    self.OpenMedia = filter([5], [4, 3, 1]);
    self.OpenProspects = filter([4], [4, 3, 1]);
    self.OpenInternalActivity = filter([1], [4, 3, 1]);
    self.InactiveProjects = filter([], [2, 5]);
    self.AllOpenJobs = filter([], [4, 3, 1]);
    //Categorias disponíveis
    var options = [];
    if (self.AllOpenJobs().length > 0)
        options.push({ order: 6, label: Resources.Job.OpenJobs, count: self.AllOpenJobs().length });
    if (self.OpenProjects().length > 0)
        options.push({ order: 0, label: Resources.Job.PresetValueType, count: self.OpenProjects().length });
    if (self.OpenAccounts().length > 0)
        options.push({ order: 1, label: Resources.Job.MonthlyValueType, count: self.OpenAccounts().length });
    if (self.OpenMedia().length > 0)
        options.push({ order: 2, label: Resources.Job.MediaCampaing, count: self.OpenMedia().length });
    if (self.OpenProspects().length > 0)
        options.push({ order: 3, label: Resources.Job.Prospecting, count: self.OpenProspects().length });
    if (self.OpenInternalActivity().length > 0)
        options.push({ order: 4, label: Resources.Job.GeneralActivity, count: self.OpenInternalActivity().length });
    if (self.InactiveProjects().length > 0)
        options.push({ order: 5, label: Resources.Job.InactiveJob, count: self.InactiveProjects().length });
    //Lista selecionada
    self.SelectedJobListIndex = ko.observable((options[0] || { order: 0 }).order);
    self.CurrentJobList = ko.computed(function () {
        if (self.SelectedJobListIndex() == 0)
            return self.OpenProjects();
        if (self.SelectedJobListIndex() == 1)
            return self.OpenAccounts();
        if (self.SelectedJobListIndex() == 2)
            return self.OpenMedia();
        if (self.SelectedJobListIndex() == 3)
            return self.OpenProspects();
        if (self.SelectedJobListIndex() == 4)
            return self.OpenInternalActivity();
        if (self.SelectedJobListIndex() == 5)
            return self.InactiveProjects();
        if (self.SelectedJobListIndex() == 6)
            return self.AllOpenJobs();
    }, self);
    self.CurrentJobListName = ko.computed(function () {
        if (self.SelectedJobListIndex() == 0)
            return Resources.Job.PresetValueType;
        if (self.SelectedJobListIndex() == 1)
            return Resources.Job.MonthlyValueType;
        if (self.SelectedJobListIndex() == 2)
            return Resources.Job.MediaCampaing;
        if (self.SelectedJobListIndex() == 3)
            return Resources.Job.Prospecting;
        if (self.SelectedJobListIndex() == 4)
            return Resources.Job.GeneralActivity;
        if (self.SelectedJobListIndex() == 5)
            return Resources.Job.InactiveJob;
        if (self.SelectedJobListIndex() == 6)
            return Resources.Job.OpenJobs;
    }, self);
    self.AvailableJobLists = ko.observableArray(options);
    //Filtros
    self.FilterText = ko.observable('');
    self.Tags = ko.computed(function () {
        return _.uniq(_.flatten(_.pluck(self.CurrentJobList(), 'Tags')), false, function (item) { return item.TagTitle; });
    }, self);
    self.SelectedTags = ko.observableArray([]);
    self.Tags.subscribe(function () {
        var newValues = _.map(self.Tags(), function (tag) {
            return new DataItem(tag.TagTitle, tag.TagTitle, false);
        });
        self.SelectedTags(newValues);
    });
    self.SelectedUsers = ko.observableArray([]);
    self.Users = ko.computed(function () {
        var users = _.map(_.uniq(self.CurrentJobList(), false, function (job) {
            return job.Owner.UserID;
        }), function (job) {
            var ret = new DataItem(job.Owner.UserLogin, job.Owner.UserID, false);
            ret.UserHashCode = job.Owner.UserHashCode;
            return ret;
        });
        return users;
    }, self);
    self.Users.subscribe(function () {
        self.SelectedUsers(self.Users());
    });
    self.SelectedProducts = ko.observableArray([]);
    self.Products = ko.computed(function () {
        var products = _.chain(self.CurrentJobList())
            .filter(function (x) { return x.Product != null; })
            .pluck('Product')
            .uniq(false, function (item) { return item.Name; })
            .map(function (product) {
            return new DataItem(product.Name, product.ProductID, false);
        }).value();
        return products;
    }, self);
    self.Products.subscribe(function () {
        self.SelectedProducts(self.Products());
    });
    //Clear
    self.ClearFilterText = function () {
        self.FilterText("");
    };
    self.ClearTags = function () {
        _.forEach(self.SelectedTags(), function (tag) { return tag.Selected(false); });
    };
    self.ClearUsers = function () {
        _.forEach(self.SelectedUsers(), function (user) { return user.Selected(false); });
    };
    self.ClearProducts = function () {
        _.forEach(self.SelectedProducts(), function (product) { return product.Selected(false); });
    };
    var refreshFilters = function () {
        self.Tags.notifySubscribers();
        self.Users.notifySubscribers();
        self.Products.notifySubscribers();
    };
    refreshFilters();
    self.CurrentJobList.subscribe(function () {
        refreshFilters();
    });
    self.FilteredJobList = ko.computed(function () {
        var ret = self.CurrentJobList();
        var fnFilter = function (job) {
            var _title = self.FilterText();
            if (_title && job.JobTitle.toLocaleLowerCase().indexOf(_title.toLocaleLowerCase()) < 0)
                return false;
            var users = _.filter(self.SelectedUsers(), function (user) { return user.Selected(); });
            if (users.length > 0 && !_.some(users, function (user) { return user.Value() == job.Owner.UserID; }))
                return false;
            var tags = _.filter(self.SelectedTags(), function (tag) { return tag.Selected(); });
            if (tags.length > 0 && !_.some(tags, function (tag) {
                var tagTitle = tag.Value();
                return _.some(job.Tags, function (jobTag) {
                    return jobTag.TagTitle == tagTitle;
                });
            }))
                return false;
            var products = _.filter(self.Products(), function (product) { return product.Selected(); });
            if (products.length > 0 && !_.some(products, function (product) { return job.ProductID > 0 && job.ProductID == product.Value(); }))
                return false;
            return true;
        };
        return _.filter(ret, fnFilter).sort(function (a, b) { return (a.JobType || '') < (b.JobType || '') ? -1 : (a.JobType || '') > (b.JobType || '') ? 1 : a.JobNumber > b.JobNumber ? 1 : a.JobNumber < b.JobNumber ? -1 : 0; });
    }, self);
    self.FilteredJobList.subscribe(function () {
        $('#joblist').jsScroll();
    });
}
define(function () {
    return ClientHome;
});
//# sourceMappingURL=ClientHome.js.map