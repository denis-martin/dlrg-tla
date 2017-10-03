
var DlrgTla = null;

var ciphertest = "1234567890";
var apiBasePath = "/";

var ctrlScopes = {};

function encrypt(plaintext)
{
	// returned ciphertext includes IV and salt
	var ciphertext = null;
	try {
		ciphertext = CryptoJS.AES.encrypt(plaintext, DlrgTla.dataKeyHash).toString();
	} catch (e) {
		console.log("Error encrypting text");
	}
	return ciphertext;
}

function decrypt(ciphertext)
{
	var plaintext = null;
	try {
		plaintext = CryptoJS.AES.decrypt(ciphertext, DlrgTla.dataKeyHash).toString(CryptoJS.enc.Utf8);
	} catch (e) {
		console.log("Error decrypting text");
	}
	return plaintext;
}

var DlrgTlaApp = angular.module('DlrgTlaApp', ['LocalStorageModule', 'ui.bootstrap', 'ui.grid', 'ui.grid.selection', 'ui.calendar'])

.controller('DlrgTlaMainCtrl', function($scope, $http, $timeout, $filter, localStorageService, $uibModal, uiGridConstants) // root controller
{
	DlrgTla = this;
	DlrgTla.version = '0.1';
	DlrgTla.thinking = "";
	DlrgTla.userName = "Unbekannter";
	DlrgTla.getUserShortName = function() { return DlrgTla.userName.split(" ")[0] };
	
	DlrgTla.uiAuthOpened = false;
	DlrgTla.needLogin = true;
	DlrgTla.needDataKey = true;
	DlrgTla.dataKeyHash = null;
	
	DlrgTla.panel = "calendar"; //"participants";
	
	DlrgTla.uiGrids = {};
	DlrgTla.uiGridSelectOptions = {
		//registrationStatus: [],
		courseStatus: [],
		lanes: [],
		yesno: [],
		// tables
		seasons: [],
		qualificationtypes: [],
		coursetypes: []
	}

	//DlrgTla.registrationStatus = ["neu", "geplant", "bestätigt", "pausiert"];
	//DlrgTla.registrationStatus.forEach(e => DlrgTla.uiGridSelectOptions.registrationStatus.push({ value: e, label: e}));

	DlrgTla.lanes = ["Nichtschwimmer", "Bahn 1", "Bahn 2", "Bahn 3", "Bahn 4", "Bahn 5", "Sprunggrube", "Lehrschwimmbecken"];
	DlrgTla.lanes.forEach(e => DlrgTla.uiGridSelectOptions.lanes.push({ value: e, label: e}));

	DlrgTla.courseStatus = ["geplant", "Nachrückerplatz", "keine Rückmeldung", "bestätigt"];
	DlrgTla.courseStatus.forEach(e => DlrgTla.uiGridSelectOptions.courseStatus.push({ value: e, label: e}));

	DlrgTla.uiGridSelectOptions.yesno.push({ value: "ja", label: "ja"});
	DlrgTla.uiGridSelectOptions.yesno.push({ value: "nein", label: "nein"});

	DlrgTla.db = {
		participants: [],
		registrations: [],
		qualifications: [],
		coursetypes: [],
		coursetypechecklists: [],
		qualificationtypes: [],
		seasons: [],
		courses: [],
		courseparticipants: [],
		presence: [],
	};
	
	DlrgTla.refreshRates = {
		participants: 5000,
		registrations: 5000,
		qualifications: 5000,
		coursetypes: 120000,
		coursetypechecklists: 120000,
		qualificationtypes: 120000,
		seasons: 120000,
		courses: 5000,
		courseparticipants: 5000,
		presence: 120000,
	};

	DlrgTla.cr = {
		p: null,
	}

	DlrgTla.presenceCache = {};

	DlrgTla.uiAuth = function() 
	{
		if (DlrgTla.uiAuthOpened) return;
		DlrgTla.uiAuthOpened = true;

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgAuth.html',
			controller: 'dlgAuthCtrl',
			backdrop: 'static',
			keyboard: false
		});

		modalInstance.result.then(
			function (res) {
				// ok
				console.log('uiAuth ok', res);
				DlrgTla.uiAuthOpened = false;
			}, 
			function (res) {
				// cancel
				DlrgTla.uiAuthOpened = false;
			}
		);
	}

	DlrgTla.uiSwitchPanel = function(panel)
	{
		if (DlrgTla.panel != panel) {
			DlrgTla.panel = panel;
			if (DlrgTla.uiGrids[panel]) {
				$timeout(function() { DlrgTla.uiGrids[panel].core.handleWindowResize(); }, 0);
				if (panel == "courses") {
					$timeout(function() { DlrgTla.uiGrids.courseparticipants.core.handleWindowResize(); }, 0);
				}
			}
			/*if (panel == "calendar") {
				$timeout(function() { DlrgTla.uiCalendarConfig.calendars.calendar.fullCalendar('rerenderEvents') }, 0);
			}*/
		}
	}

	DlrgTla.uiEditParticipant = function(participant, copyFromParticipant) 
	{
		if (typeof participant == "number") {
			participant = DlrgTla.getEntry("participants", participant);
		}

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgParticipantEdit.html',
			controller: 'DlgParticipantEditCtrl',
			size: 'lg', // 'lg', 'sm'
			resolve: {
				participant: function () { return participant; },
				copyFromParticipant: function () { return copyFromParticipant; },
			}
		});

		modalInstance.result.then(function (res) {
			// ok
			console.log('uiEditParticipant ', res);
		}, function () {
			// cancel
			if (participant) {
				DlrgTla.resetData(participant, "participants");
			}
			console.log('uiEditParticipant cancel');
		});
	}

	DlrgTla.uiEditRegistration = function(registration, pId) 
	{
		if (typeof registration == "number") {
			registration = DlrgTla.getEntry("registrations", registration);
		}

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgRegistrationEdit.html',
			controller: 'DlgRegistrationEditCtrl',
			size: 'md', // 'lg', 'sm'
			resolve: {
				registration: function () { return registration; },
				pId: function () { return registration ? registration.pId : pId; }
			}
		});

		modalInstance.result.then(function (res) {
			// ok
			console.log('uiEditRegistration ', res);
		}, function () {
			// cancel
			if (registration) {
				DlrgTla.resetData(registration, "registrations");
			}
			console.log('uiEditRegistration cancel');
		});
	}

	DlrgTla.uiEditQualification = function(obj, pId) 
	{
		if (typeof obj == "number") {
			obj = DlrgTla.getEntry("qualifications", obj);
		}

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgQualificationEdit.html',
			controller: 'DlgQualificationEditCtrl',
			size: 'lg', // 'lg', 'sm'
			resolve: {
				obj: function () { return obj; },
				pId: function () { return obj ? obj.pId : pId; }
			}
		});

		modalInstance.result.then(function (res) {
			// ok
			console.log('uiEditQualification ', res);
		}, function () {
			// cancel
			if (obj) {
				DlrgTla.resetData(obj, "qualifications");
			}
			console.log('uiEditQualification cancel');
		});
	}

	DlrgTla.uiEditSeason = function(obj)
	{
		if (typeof obj == "number") {
			obj = DlrgTla.getEntry("seasons", obj);
		}

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgSeasonEdit.html',
			controller: 'DlgSeasonEditCtrl',
			size: 'md', // 'lg', 'sm'
			resolve: {
				obj: function () { return obj; },
			}
		});

		modalInstance.result.then(function (res) {
			// ok
			console.log('uiEditSeason ', res);
		}, function () {
			// cancel
			if (obj) {
				DlrgTla.resetData(obj, "seasons");
			}
			console.log('uiEditSeason cancel');
		});
	}

	DlrgTla.uiEditSeasonDay = function(d)
	{
		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgSeasonDayEdit.html',
			controller: 'DlgSeasonDayEditCtrl',
			size: 'md', // 'lg', 'sm'
			resolve: {
				d: function () { return d; },
			}
		});

		modalInstance.result.then(function (res) {
			// ok
			console.log('uiEditSeasonDay', res);
		}, function () {
			// cancel
			if (d) {
				DlrgTla.resetData(d, "seasons");
			}
			console.log('uiEditSeasonDay cancel');
		});
	}

	DlrgTla.uiEditCourse = function(obj)
	{
		if (typeof obj == "number") {
			obj = DlrgTla.getEntry("courses", obj);
		}

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgCourseEdit.html',
			controller: 'DlgCourseEditCtrl',
			size: 'lg', // 'lg', 'sm'
			resolve: {
				obj: function () { return obj; },
			}
		});

		modalInstance.result.then(function (res) {
			// ok
			console.log('uiEditCourse ', res);
		}, function () {
			// cancel
			if (obj) {
				DlrgTla.resetData(obj, "courses");
			}
			console.log('uiEditCourse cancel');
		});
	}

	DlrgTla.uiEditCourseParticipant = function(obj, cId, pId, instructor)
	{
		if (typeof obj == "number") {
			obj = DlrgTla.getEntry("courseparticipants", obj);
		}

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'ui/dlgCourseParticipantEdit.html',
			controller: 'DlgCourseParticipantEditCtrl',
			size: 'lg', // 'lg', 'sm'
			resolve: {
				obj: function () { return obj; },
				cId: function () { return cId; },
				pId: function () { return pId; },
				instructor: function () { return instructor; },
			}
		});

		modalInstance.result.then(function (res) {
			// ok
			console.log('uiEditCourseParticipant ', res);
		}, function () {
			// cancel
			if (obj) {
				DlrgTla.resetData(obj, "courseparticipants");
			}
			console.log('uiEditCourseParticipant cancel');
		});
	}

	DlrgTla.loginTest = function(fnSuccess, fnError)
	{
		DlrgTla.thinking = "Sende Anmeldeinformationen...";
		$http.get(apiBasePath + "api/login").then(
			function(response) {
				console.log("loginTest success", response);
				DlrgTla.loginSuccess(response, fnSuccess);
			},
			function(response) {
				console.log("loginTest error", response);
				DlrgTla.thinking = "";
				DlrgTla.needLogin = true;
				if (response.data.user) {
					DlrgTla.userName = response.data.user;
				}
				if (fnError) {
					fnError(response);
				}
			}
		);
	}

	DlrgTla.login = function(passphrase, fnSuccess, fnError)
	{
		DlrgTla.thinking = "Sende Anmeldeinformationen...";
		$http.post(apiBasePath + "api/login", { user: DlrgTla.userName, passphrase: passphrase }).then(
			function(response) {
				console.log("login success", response);
				DlrgTla.loginSuccess(response, fnSuccess);
			},
			function(response) {
				console.log("login error", response);
				DlrgTla.thinking = "";
				DlrgTla.needLogin = true;
				if (response.data.user) {
					DlrgTla.userName = response.data.user;
				}
				if (fnError) {
					fnError(response);
				}
			}
		);
	}

	DlrgTla.loginSuccess = function(response, fnSuccess)
	{
		DlrgTla.thinking = "";
		DlrgTla.needLogin = false;
		if (!DlrgTla.dataKeyHash) {
			DlrgTla.dataKeyHash = localStorageService.get("dkh");
		}
		if (DlrgTla.dataKeyHash && (decrypt(response.data.ciphertest) == ciphertest)) {
			if (DlrgTla.needDataKey) {
				localStorageService.set("dkh", DlrgTla.dataKeyHash);
			}
			DlrgTla.needDataKey = false;
			DlrgTla.startPeriodicRefreshs();
		} else {
			DlrgTla.needDataKey = true;
		}
		if (fnSuccess) {
			fnSuccess();
		}
	}

	DlrgTla.logout = function()
	{
		DlrgTla.thinking = "Abmelden...";
		$http.get(apiBasePath + "api/logout").then(
			function(response) {
				DlrgTla.needLogin = true;
				console.log("success", response);
				DlrgTla.thinking = "";
				DlrgTla.loginTest();
			},
			function(response) {
				console.log("error", response);
				DlrgTla.thinking = "";
				DlrgTla.loginTest();
			}
		);
	}

	DlrgTla.getSetDate = function(element, field, v)
	{
		if (v === null) {
			element[field] = null;
			element._private[field] = v;
			return element._private[field];
		} else if (v !== undefined) {
			element[field] = v.toISOString().split("T")[0];
			element._private[field] = v;
			return element._private[field];
		} else {
			return element._private[field];
		}
	}

	DlrgTla.getSetDataDate = function(element, field, v)
	{
		if (v === null) {
			element.data[field] = null;
			element._private[field] = v;
			return element._private[field];
		} else if (v !== undefined) {
			element.data[field] = v.toISOString().split("T")[0];
			element._private[field] = v;
			return element._private[field];
		} else {
			return element._private[field];
		}
	}

	DlrgTla.resetData = function(element, table, killprivates)
	{
		if (killprivates) {
			angular.forEach(element, function(v, k) {
				if (k.startsWith("_")) {
					delete element[k];
				}
			});
		}
		if (element.data_enc) {
			try {
				var plaintext = decrypt(element.data_enc);
				element.data = JSON.parse(plaintext);
			} catch (e) {
				console.error("Cannot decrypt/parse encrypted data:", e);
			}
		} 
		if (element._shadow) {
			try {
				var shadowObject = JSON.parse(element._shadow);
				angular.forEach(shadowObject, function(v, k) {
					element[k] = v;
				});
			} catch (e) {
				console.error("Cannot parse shadow data:", e);
			}
		} else {
			element._shadow = JSON.stringify(element);
		}

		if (!element._private) element._private = {};

		if (table == "participants") {
			element._private.birthdate = new Date(element.data.birthdate);

			element.getSetBirthdate = function(v) {
				if (v) {
					this.data.birthdate = v.toISOString().split("T")[0];
					this._private.birthdate = v;
					return this._private.birthdate;
				} else {
					return this._private.birthdate;
				}
			}

			element.getAge = function() {
				if (!this.data.birthdate) {
					return 0;
				}
				var d = Date.now() - this._private.birthdate;
				var age = new Date(d);
				return ~~Math.abs(((age.getUTCFullYear() - 1970) + (age.getUTCMonth()+1)/12) * 10) / 10;
			}

		} else if (table == "registrations") {
			element._private.date = element.data.date ? new Date(element.data.date) : null;
			element.getSetDate = function(v) { return DlrgTla.getSetDataDate(this, "date", v); }

		} else if (table == "qualifications") {
			element._private.date = element.data.date ? new Date(element.data.date) : null;
			element._private.expiryDate = element.data.expiryDate ? new Date(element.data.expiryDate) : null;
			element._private.renewalDate = element.data.renewalDate ? new Date(element.data.renewalDate) : null;

			element.getSetDate = function(v) { return DlrgTla.getSetDataDate(this, "date", v); }
			element.getSetExpiryDate = function(v) { return DlrgTla.getSetDataDate(this, "expiryDate", v); }
			element.getSetRenewalDate = function(v) { return DlrgTla.getSetDataDate(this, "renewalDate", v); }

		} else if (table == "seasons") {
			if (!element.data) element.data = {};
			if (!element.data.dates) element.data.dates = {};
			
			element._private.begin = element.begin ? new Date(element.begin) : null;
			element._private.begin2 = element.begin2 ? new Date(element.begin2) : null;
			element._private.end = element.end ? new Date(element.end) : null;
			element._private.days1 = [];
			element._private.days2 = [];

			element.getSetBegin = function(v) { 
				if (v) element._private.days1.length = 0;
				return DlrgTla.getSetDate(this, "begin", v); 
			}
			element.getSetBegin2 = function(v) { 
				if (v) {
					element._private.days1.length = 0;
					element._private.days2.length = 0;
				}
				return DlrgTla.getSetDate(this, "begin2", v); 
			}
			element.getSetEnd = function(v) { 
				if (v) element._private.days2.length = 0;
				return DlrgTla.getSetDate(this, "end", v); 
			}

			element.getDays1 = function() {
				if (element._private.days1.length == 0 && element._private.begin && element._private.begin2) {
					var d = new Date(element._private.begin);
					while (d < element._private.begin2) {
						var dstr = d.toISOString().split("T")[0];
						if (element.data.dates[dstr]) {
							element._private.days1.push({ date: new Date(d), training: element.data.dates[dstr].training, desc: element.data.dates[dstr].desc });
						} else {
							element._private.days1.push({ date: new Date(d), training: true, desc: null });
						}
						d.setDate(d.getDate() + 7);
					}
				}
				return element._private.days1;
			}
			element.getDays2 = function() {
				if (element._private.days2.length == 0 && element._private.begin2 && element._private.end) {
					var d = new Date(element._private.begin2);
					while (d < element._private.end) {
						var dstr = d.toISOString().split("T")[0];
						if (element.data.dates[dstr]) {
							element._private.days2.push({ date: new Date(d), training: element.data.dates[dstr].training, desc: element.data.dates[dstr].desc });
						} else {
							element._private.days2.push({ date: new Date(d), training: true, desc: null });
						}
						d.setDate(d.getDate() + 7);
					}
				}
				return element._private.days2;
			}

			element.getEnd1 = function() {
				if (element._private.days1.length > 0) {
					return _.last(element._private.days1).date;
				}
				return null;
			}

		} else if (table == "courses") {
			element._private.begin = element.begin ? new Date(element.begin) : null;
			element._private.end = element.end ? new Date(element.end) : null;

			element.getSetBegin = function(v) { return DlrgTla.getSetDate(this, "begin", v); }
			element.getSetEnd = function(v) { return DlrgTla.getSetDate(this, "end", v); }

		} else if (table == "courseparticipants") {
			element._private.chargePayedAt = element.data.chargePayedAt ? new Date(element.data.chargePayedAt) : null;
			element.getSetChargePayedAt = function(v) { return DlrgTla.getSetDataDate(this, "chargePayedAt", v); }

		}
	}

	DlrgTla.setDataEnc = function(element)
	{
		console.log("setDataEnc", element);
		element.data_enc = encrypt(JSON.stringify(element.data));
	}

	DlrgTla.getEntry = function(table, id)
	{
		var i = DlrgTla.db[table].map(e => e.id).indexOf(id);
		return (i >= 0) ? DlrgTla.db[table][i] : null;
	}
	
	DlrgTla.getEntriesByParticipant = function(table, pId)
	{
		return $filter('filter')(DlrgTla.db[table], { pId: pId }, true);

		/*if (!pId) return [];
		
		var elements = DlrgTla.db[table].filter(e => (e.pId == pId));
		return elements;*/
	}

	DlrgTla.getSeason = function()
	{
		if (!DlrgTla._season || DlrgTla._season.id != DlrgTla.sId) {
			DlrgTla._season = DlrgTla.getEntry('seasons', DlrgTla.sId);
		}
		return DlrgTla._season;
	}

	DlrgTla.presence = function(date, pId)
	{
		var ds = date.toISOString().split("T")[0];
		if (!DlrgTla.presenceCache[ds]) {
			DlrgTla.presenceCache[ds] = {};
			DlrgTla.db.presence.forEach(r => {
				if (r.date.split("T")[0] == ds) {
					DlrgTla.presenceCache[ds][r.pId] = r;
				}
			});
		}
		if (DlrgTla.presenceCache[ds].hasOwnProperty(pId)) {
			return DlrgTla.presenceCache[ds][pId].presence;
		}
		return null;
	}

	DlrgTla.getEntriesFiltered = function(table, filterObj)
	{
		return $filter('filter')(DlrgTla.db[table], filterObj, true);
	}

	DlrgTla.getCourseParticipantCount = function(course)
	{
		if (typeof course == "number") {
			course = DlrgTla.getEntry("course", course);
		}

		if (course) {
			var count = 0;
			DlrgTla.db.courseparticipants.forEach(function(e) {
				if (e.cId == course.id && !e.instructor && (e.status == 0 || e.status == 3)) {
					count = count + 1;
				}
			});
			return count;
		}
		return null;
	}

	DlrgTla.periodicRefreshTable = function(table)
	{
		//DlrgTla.db[table].length = 0;
		$http.get(apiBasePath + "api/db/" + table).then(
			function(response) {
				//console.log("get api/db/"+ table + " success", response);
				if (!DlrgTla.db[table] || DlrgTla.db[table].length == 0) {
					// initial fetch of data
					DlrgTla.db[table] = response.data;
					DlrgTla.db[table].forEach(function(element) {
						DlrgTla.resetData(element, table);
					});
					if (table == "coursetypes" || table == "qualificationtypes" || table == "seasons") {
						DlrgTla.uiGridSelectOptions[table].length = 0;
						DlrgTla.db[table].forEach(function(element) {
							DlrgTla.uiGridSelectOptions[table].push({ value: element.name, label: element.name });
						});
					}

					if (table == "participants") {
						$timeout(function() { DlrgTla.uiGrids.participants.selection.selectRowByVisibleIndex(0); }, 0);
						DlrgTla.periodicRefreshTable("qualifications");
						DlrgTla.periodicRefreshTable("courseparticipants");
						DlrgTla.periodicRefreshTable("registrations");
						DlrgTla.periodicRefreshTable("presence");

					} else if (table == "courseparticipants") {
						var bp = {};
						DlrgTla.db[table].forEach(v => {
							if (v.sId == DlrgTla.sId) {
								bp[v.pId] = DlrgTla.getEntry("participants", v.pId);
							}
						});
						DlrgTla.calendar.setBirthdates(bp);

					} else if (table == "seasons") {
						if (!DlrgTla.sId) {
							var now = new Date();
							for (var i = 0; i < DlrgTla.db[table].length; i++) {
								if (now <= DlrgTla.db[table][i].getSetEnd()) { // assuming chronological entries
									DlrgTla.sId = DlrgTla.db[table][i].id;
									break;
								}
							}
							DlrgTla.setSeason(DlrgTla.sId);
							DlrgTla.periodicRefreshTable("courses");
						}
					}
				} else {
					// incremental update
					var pos = response.data.map(e => e.id);
					DlrgTla.db[table].forEach(function(element, i, elementArray) {
						var j = pos.indexOf(element.id);
						if (j >= 0) {
							// update element
							if (element.changedAt != response.data[j].changedAt) {
								console.log("updating", table, i);
								// clear private variables
								angular.forEach(element, function(v, k) {
									if (k.startsWith("_")) {
										delete element[k];
									}
								});
								// update keys
								angular.forEach(response.data[j], function(v, k) {
									element[k] = v;
								});
								DlrgTla.resetData(element, table);
							}
						} else {
							// remove element
							console.log("removing", table, i);
							elementArray.splice(i, 1);
						}
					});
					var curPos = DlrgTla.db[table].map(e => e.id);
					response.data.forEach(function(element, i) {
						var j = curPos.indexOf(element.id);
						if (j == -1) {
							// add element
							DlrgTla.resetData(element, table);
							DlrgTla.db[table].push(element);
						}
					});
				}
				$timeout(function() { DlrgTla.periodicRefreshTable(table); }, DlrgTla.refreshRates[table]);
			},
			function(response) {
				console.log("get api/db/"+ table + " error", response);
				if (response.status == 401) {
					DlrgTla.loginTest(
						function() {
							if (DlrgTla.needDataKey) {
								//DlrgTla.db[table].length = 0;
								DlrgTla.uiAuth();
							}
						}, 
						function() {
							//DlrgTla.db[table].length = 0;
							DlrgTla.uiAuth();
						});
				} else {
					// hope that it is only temporary
					$timeout(function() { DlrgTla.periodicRefreshTable(table); }, DlrgTla.refreshRates[table]);
				}
			}
		);
	}

	DlrgTla.startPeriodicRefreshs = function()
	{
		DlrgTla.calendar.load("dlrgettlingen");
		DlrgTla.calendar.load("feiertage");
		DlrgTla.calendar.load("ferienbw");
		
		DlrgTla.periodicRefreshTable("coursetypes");
		DlrgTla.periodicRefreshTable("coursetypechecklists");
		DlrgTla.periodicRefreshTable("qualificationtypes");
		DlrgTla.periodicRefreshTable("seasons");
		DlrgTla.periodicRefreshTable("participants");
	}

	DlrgTla.setSeason = function(sId)
	{
		DlrgTla.sId = sId;
		if (DlrgTla.sId) {
			ctrlScopes.courses.gridApi.grid.columns[0].filters[0].term = DlrgTla.getSeason().name;
			ctrlScopes.courses.gridApiCp.grid.columns[0].filters[0].term = DlrgTla.getSeason().name;
			ctrlScopes.courses.gridApi.grid.refresh();
			ctrlScopes.courses.gridApiCp.grid.refresh();
		}
	}

	// only used for import
	DlrgTla.importEntry = function(table, id, body, fnSuccess, fnError)
	{
		if (body.data) {
			body.data_enc = encrypt(JSON.stringify(body.data));
			delete body.data;
		}
		DlrgTla.thinking = "Importiere Eintrag...";
		if (id) {
			$http.post(apiBasePath + "api/db/" + table + "/" + id, body).then(
				function(response) {
					console.log("post api/db/" + table + "/" + id + " success", response);
					DlrgTla.thinking = "";
					if (fnSuccess) {
						fnSuccess();
					}
				},
				function(response) {
					console.log("post api/db/" + table + "/" + id + " error", response);
					DlrgTla.thinking = "";
					if (fnError) {
						fnError();
					}
				}
			);
		} else {
			$http.post(apiBasePath + "api/db/" + table, body).then(
				function(response) {
					console.log("post api/db/" + table + " success", response);
					DlrgTla.thinking = "";
					if (fnSuccess) {
						fnSuccess();
					}
				},
				function(response) {
					console.log("post api/db/" + table + " error", response);
					DlrgTla.thinking = "";
					if (fnError) {
						fnError();
					}
				}
			);
		}
	}

	DlrgTla.loginTest(function() {
		if (DlrgTla.needDataKey) {
			DlrgTla.uiAuth();
		}
	}, DlrgTla.uiAuth);
})

.controller('dlgAuthCtrl', function ($scope, $uibModalInstance)
{
	$scope.DlrgTla = DlrgTla;
	$scope.authFailed = false;
	$scope.authSuccess = false;
	$scope.decFailed = false;
	$scope.serverFailure = 0;

	$scope.ok = function () 
	{
		$scope.authFailed = false;
		$scope.decFailed = false;
		if (DlrgTla.needDataKey && DlrgTla.dataKey) {
			DlrgTla.dataKeyHash = CryptoJS.SHA256(DlrgTla.dataKey).toString();
		}
		if (DlrgTla.needLogin) {
			DlrgTla.login(DlrgTla.passphrase, function() {
				$scope.authSuccess = true;
				if (!DlrgTla.needDataKey) {
					delete DlrgTla.dataKey;
					delete DlrgTla.passphrase;
					$uibModalInstance.dismiss('ok');
				} else {
					$scope.decFailed = true;
				}
			}, function(response) {
				if (response.status == 401) {
					$scope.authFailed = true;
				} else {
					$scope.serverFailure = response.status;
				}
			});
		} else {
			DlrgTla.loginTest(function() {
				$scope.authSuccess = true;
				if (!DlrgTla.needDataKey) {
					delete DlrgTla.dataKey;
					delete DlrgTla.passphrase;
					$uibModalInstance.dismiss('ok');
				} else {
					$scope.decFailed = true;
				}
			}, function(response) {
				if (response.status == 401) {
					$scope.authFailed = true;
				} else {
					$scope.serverFailure = response.status;
				}
			});
		}
	};

	$scope.cancel = function () {};

}) // dlgAuthCtrl

.directive('convertToNumber', function() 
{
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, ngModel) {
			ngModel.$parsers.push(function(val) {
				return parseInt(val, 10);
			});
			ngModel.$formatters.push(function(val) {
				return '' + val;
			});
		}
	};
})

.filter('dbfield', function() 
{
	var dbfieldCache = {};
	return function(value, table, field) {
		if (!dbfieldCache[table]) dbfieldCache[table] = {};
		var p = dbfieldCache[table][value];
		if (!p) {
			var len = DlrgTla.db[table].length;
			for (var i = 0; i < len; i++) {
				if (DlrgTla.db[table][i].id == value) {
					p = DlrgTla.db[table][i];
					dbfieldCache[table][value] = p;
					break;
				}
			}
			if (!p) {
				return value;
			}
		}

		if (field) {
			var fields = field.split('.');
			var val = p;
			fields.forEach(f => val = val[f]);
			if (typeof val == "function" && fields.length == 1) {
				return val.call(p);
			} else {
				return val;
			}

		} else {
			return p;

		}
	}
})

.filter('age', function() 
{
	return function(value) {
		if (!value) {
			return 0;
		}
		var d = Date.now() - new Date(value);
		var age = new Date(d);
		return ~~Math.abs(((age.getUTCFullYear() - 1970) + (age.getUTCMonth()+1)/12) * 10) / 10;
	}
})

.filter('courseStatus', function() 
{
	return function(value, ispId, sId) {
		if (ispId) {
			var r = null;
			var cp = DlrgTla.getEntriesFiltered("courseparticipants", { sId: sId, pId: value });
			cp.forEach(function(e) {
				var c = DlrgTla.getEntry("courses", e.cId);
				if (r) {
					r = r + ", " + DlrgTla.courseStatus[e.status] + ": " + c.name;
				} else {
					r = DlrgTla.courseStatus[e.status] + ": " + c.name;
				}
				if (e.instructor) {
					r = r + "(A)";
				}
			});
			return r;

		} else if (typeof value == "number" && value >= 0 && value < DlrgTla.courseStatus.length) {
			return DlrgTla.courseStatus[value];
			
		} else {
			return value;
		}
	}
})

.filter('yesno', function() 
{
	return function(value) {
		if (typeof value == "number" && (value == 0 || value == 1)) {
			return value ? "ja" : "nein";
			
		} else {
			return value;
		}
	}
})

.filter('shorten', function() 
{
	return function(value, count) {
		if (!count) count = 14;
		if (typeof value != "string") return value;

		if (value.length > count) return value.substr(0, 13) + "...";
	}
})

.config(function ($httpProvider) {
	$httpProvider.defaults.withCredentials = true;
	$httpProvider.defaults.headers.post = { "Content-Type": "application/json" };
})

;
