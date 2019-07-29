
DlrgTlaApp.controller('CoursesCtrl', ['$scope', '$uibModal', 'uiGridConstants', function ($scope, $uibModal, uiGridConstants)
{
	$scope.DlrgTla = DlrgTla;
	$scope.table = "courses";
	$scope.cr = null;
	$scope.crCp = null;
	ctrlScopes[$scope.table] = $scope; // dirty

	$scope.isActive = function() {
		return DlrgTla.panel == 'courses';
	}

	// courses
	$scope.gridOptions = {
		enableSorting: true,
		enableFiltering: true,
		enableColumnMenus: false,
		rowHeight: 24,
		enableRowSelection: true,
		enableFullRowSelection: true,
		enableRowHeaderSelection: false,
		multiSelect: false,
		noUnselect: true,
		isRowSelectable: function(row) { return true; },
		columnDefs: [
			//{ name: 'ID', field: 'id', type: 'number', width: 40 },
			{ name: 'Saison', field: 'sId', width: 130, cellFilter: 'dbfield:"seasons":"name"', filterCellFiltered: true, sortCellFiltered: true,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.seasons,
					term: DlrgTla.sId ? DlrgTla.getSeason().name : ""
				},
				visible: false
			},
			{ name: 'Kursname', field: 'name', width: 100 },
			{ name: 'Kurstyp', field: 'ctId', width: 110, type: "number", cellFilter: 'dbfield:"coursetypes":"name"',
				filterCellFiltered: true, sortCellFiltered: false,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.coursetypes
				},
				sort: { direction: 'asc', priority: 1 },
			},
			{ name: 'Bahn', field: 'lane', width: 110,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.lanes
				}
			},
			{ name: 'Beginn', field: 'begin', width: 80, cellFilter: 'date:"dd.MM.yyyy"', filterCellFiltered: true, sortCellFiltered: false,
				sort: { direction: 'asc', priority: 0 } },
			{ name: 'Belegung', field: 'capacity', //width: 80,
				cellTemplate: '<div class="ui-grid-cell-contents">{{grid.appScope.DlrgTla.getCourseParticipantCount(row.entity)}} / {{grid.getCellValue(row, col)}}</div>' },
			//{ name: 'S/K', field: 'seasonPass', width: 40,
			//	cellTemplate: '<div class="ui-grid-cell-contents" title="{{grid.getCellValue(row, col) ? \'Saisonkarte\' : \'Kurskarte\'}}">{{grid.getCellValue(row, col) ? "S" : "K"}}</div>' },
			//{ name: 'Kosten', field: 'charge', 
			//	cellTemplate: '<div class="ui-grid-cell-contents">{{grid.getCellValue(row, col)}} <span ng-if="grid.getCellValue(row, col)"> €</span><span ng-if="row.entity.chargeNonMember"> ({{row.entity.chargeNonMember}} €)</span></div>' },
		],
		data: DlrgTla.db[$scope.table]
	};

	$scope.gridOptions.onRegisterApi = function(gridApi)
	{
		DlrgTla.uiGrids[$scope.table] = gridApi;
		$scope.gridApi = gridApi;

		$scope.gridApi.selection.on.rowSelectionChanged($scope, function(row) {
			var pos = DlrgTla.db[$scope.table].map(e => e.id).indexOf(row.entity.id);
			$scope.cr = DlrgTla.db[$scope.table][pos];
			ctrlScopes.courses.gridApiCp.grid.columns[0].filters[0].term = DlrgTla.getEntry("seasons", $scope.cr.sId).name;
			ctrlScopes.courses.gridApiCp.grid.columns[1].filters[0].term = $scope.cr.name;
			ctrlScopes.courses.gridApiCp.grid.refresh();
		});
	}

	// courseparticipants
	$scope.gridOptionsCp = {
		enableSorting: true,
		enableFiltering: true,
		enableColumnMenus: false,
		rowHeight: 24,
		enableRowSelection: true,
		enableFullRowSelection: true,
		enableRowHeaderSelection: false,
		multiSelect: false,
		noUnselect: true,
		isRowSelectable: function(row) { return true; },
		columnDefs: [
			//{ name: 'ID', field: 'id', type: 'number', width: 40 },
			{ name: 'Saison', field: 'sId', width: 130, cellFilter: 'dbfield:"seasons":"name"', filterCellFiltered: true, sortCellFiltered: true,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.seasons,
					term: DlrgTla.sId ? DlrgTla.getSeason().name : ""
				},
				visible: false
			},
			{ name: 'Kursname', field: 'cId', width: 100, cellFilter: 'dbfield:"courses":"name"', filterCellFiltered: true, sortCellFiltered: false,
				sort: { direction: 'asc', priority: 0 }, 
				//visible: false
			},
			{ name: 'Nachname', field: 'pId', width: 100, cellFilter: 'dbfield:"participants":"data.lastName"', filterCellFiltered: true, sortCellFiltered: true,
				sort: { direction: 'asc', priority: 2 }, 
			},
			{ name: 'Vorname', field: 'pId', width: 100, cellFilter: 'dbfield:"participants":"data.firstName"', filterCellFiltered: true, sortCellFiltered: true,
				sort: { direction: 'asc', priority: 3 }, 
			},
			{ name: 'Ausbilder', field: 'instructor', width: 60, cellFilter: 'yesno', filterCellFiltered: true, sortCellFiltered: false,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.yesno
				},
				sort: { direction: 'desc', priority: 1 }
			},
			{ name: 'Status', field: 'status', width: 90, cellFilter: 'courseStatus', filterCellFiltered: true, sortCellFiltered: true,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.courseStatus
				} 
			},
			{ name: 'Bezahlt', field: 'data.chargePayedAt', width: 80, cellFilter: 'date:"dd.MM.yyyy"', filterCellFiltered: true, sortCellFiltered: false },
			{ name: 'Alter', field: 'pId', width: 70, cellFilter: 'dbfield:"participants":"getAge"', filterCellFiltered: true, sortCellFiltered: true,
				sortingAlgorithm: function(a, b) { return a==b? 0 : ((a<b)? -1 : 1); },
				filter: {
					condition: uiGridConstants.filter.GREATER_THAN_OR_EQUAL,
					placeholder: "älter als"
				}
			},
			{ name: 'Notizen', field: 'data.notes' },
		],
		data: DlrgTla.db.courseparticipants
	};

	$scope.gridOptionsCp.onRegisterApi = function(gridApi)
	{
		DlrgTla.uiGrids["courseparticipants"] = gridApi;
		$scope.gridApiCp = gridApi;

		$scope.gridApiCp.selection.on.rowSelectionChanged($scope, function(row) {
			var pos = DlrgTla.db["courseparticipants"].map(e => e.id).indexOf(row.entity.id);
			$scope.crCp = DlrgTla.db["courseparticipants"][pos];
		});
	}

	$scope.getParticipant = function()
	{
		if ($scope.crCp) {
			if (!$scope.crCpObj || $scope.crCpObj.pId !== $scope.crCp.pId) {
				$scope.crCpObj = DlrgTla.getEntry("participants", $scope.crCp.pId);
			}
			return $scope.crCpObj;
		}
		return null;
	}

	$scope.getMailAdresses = function()
	{
		if (!$scope.gridApiCp) return "";

		var filtered = $scope.gridApiCp.core.getVisibleRows($scope.gridApiCp.grid);
		var entities = _.map(filtered, 'entity'); // Entities extracted from the GridRow array
		var mailStr = "";
		var mails = {};

		angular.forEach(entities, function(e) {
			//console.log(e, e.pId);
			var p = DlrgTla.getEntry("participants", e.pId);
			if (!e.instructor) {
				if (p.data.email && !mails[p.data.email]) {
					mailStr = mailStr + p.data.email + ";"
					mails[p.data.email] = true;
				}
				if (p.data.altEmail && !mails[p.data.altEmail]) {
					mailStr = mailStr + p.data.altEmail + ";"
					mails[p.data.altEmail] = true;
				}
			}
		});
		return mailStr;
	}
}]); // CoursesCtrl

DlrgTlaApp.controller('DlgCourseEditCtrl', function ($scope, $uibModalInstance, $http, obj)
{
	$scope.DlrgTla = DlrgTla;

	$scope.obj = obj;
	if (!$scope.obj) {
		var sobj = DlrgTla.sId ? DlrgTla.getEntry("seasons", DlrgTla.sId) : null;
		$scope.obj = { 
			sId: DlrgTla.sId, ctId: -1, name: null, 
			begin: (sobj && sobj.begin) ? sobj.begin.toISOString().split("T")[0] : (new Date()).toISOString().split("T")[0], 
			end: (sobj && sobj.end) ? sobj.end.toISOString().split("T")[0] : (new Date()).toISOString().split("T")[0],
			seasonPass: 0,
		};
		DlrgTla.resetData($scope.obj, "courses");
	}
	
	if (obj) {
		$scope.modalTitle = "Kurs bearbeiten";
	} else {
		$scope.modalTitle = "Neuen Kurs erfassen";
	}

	$scope.ok = function () 
	{
		$scope.missing = false;

		if (!$scope.obj.sId || $scope.obj.sId == -1) {
			$scope.missing = "Saison";
		}
		if (!$scope.obj.ctId || $scope.obj.ctId == -1) {
			$scope.missing = $scope.missing ? $scope.missing + ", " : "";
			$scope.missing = $scope.missing + "Kurstyp";
		}
		if (!$scope.obj.name) {
			$scope.missing = $scope.missing ? $scope.missing + ", " : "";
			$scope.missing = $scope.missing + "Kursname";
		}
		if ($scope.missing) {
			return;
		}

		DlrgTla.thinking = "Kurs wird gespeichert..."
		$scope.commitFailed = false;

		var body = {};
		angular.forEach($scope.obj, function(v, k) {
			if (!k.startsWith("_") && k != "data") {
				body[k] = v;
				if ((k == 'begin' && body[k]) || (k == 'end' && body[k])) {
					body[k].toISOString().split("T")[0];
				}
			}
		});
		if ($scope.obj.id) {
			$http.put(apiBasePath + "api/db/courses/" + $scope.obj.id, body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "courses", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/courses success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/courses error", response);
				}
			);
		} else {
			$http.post(apiBasePath + "api/db/courses", body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.id) {
						$scope.obj.id = response.data.id;
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "courses", true);
						DlrgTla.db.courses.push($scope.obj);
					}
					$uibModalInstance.close('ok');
					console.log("post api/db/courses success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("post api/db/courses error", response);
				}
			);
		}
	};

	$scope.delete = function () 
	{
		if (confirm("Kurs wirklich löschen?")) {
			DlrgTla.thinking = "Kurs wird gelöscht..."
			$scope.commitFailed = false;

			$http.delete(apiBasePath + "api/db/courses/" + $scope.obj.id).then(
				function(response) {
					DlrgTla.thinking = "";
					var pos = DlrgTla.db.courses.map(e => e.id).indexOf($scope.obj.id);
					DlrgTla.db.courses.splice(pos, 1);
					if (ctrlScopes.courses) ctrlScopes.courses.cr = null;
					$uibModalInstance.close('ok');
					console.log("delete api/db/courses success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("delete api/db/courses error", response);
				}
			);
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgCourseEditCtrl

DlrgTlaApp.controller('DlgCourseParticipantEditCtrl', function ($scope, $uibModalInstance, $http, obj, cId, pId, instructor)
{
	$scope.DlrgTla = DlrgTla;

	console.log(obj, cId, pId);
	$scope.obj = obj;
	if (!$scope.obj) {
		var charge = null;
		if (cId) {
			if (pId) {
				var cobj = DlrgTla.getEntry("courses", cId);
				var pobj = DlrgTla.getEntry("participants", pId);
				charge = pobj.data.membership ? cobj.charge : cobj.chargeNonMember;
			} else {
				var cobj = DlrgTla.getEntry("courses", cId);
				charge = cobj.charge;
			}
		}
		$scope.obj = { 
			sId: DlrgTla.sId,
			cId: cId,
			pId: pId,
			instructor: instructor ? 1 : 0,
			charge: charge,
			chargePayedAt: null,
			familyDiscount: 0,
			status: 0,
			passSent: 0,
			data: {},
		};
		DlrgTla.resetData($scope.obj, "courseparticipants");
	}
	
	if (obj) {
		$scope.modalTitle = "Kursteilnehmer bearbeiten";
	} else {
		$scope.modalTitle = "Neuen Kursteilnehmer erfassen";
	}

	$scope.ok = function () 
	{
		$scope.missing = false;

		if (!$scope.obj.sId || $scope.obj.sId == -1) {
			$scope.missing = "Saison";
		}
		if (!$scope.obj.cId || $scope.obj.cId == -1) {
			$scope.missing = $scope.missing ? $scope.missing + ", " : "";
			$scope.missing = $scope.missing + "Kurs";
		}
		if (!$scope.obj.pId || $scope.obj.pId == -1) {
			$scope.missing = $scope.missing ? $scope.missing + ", " : "";
			$scope.missing = $scope.missing + "Teilnehmer";
		}
		if ($scope.missing) {
			return;
		}

		DlrgTla.thinking = "Kursteilnehmer wird gespeichert..."
		$scope.commitFailed = false;
		DlrgTla.setDataEnc($scope.obj);

		var body = {};
		angular.forEach($scope.obj, function(v, k) {
			if (!k.startsWith("_") && k != "data") {
				body[k] = v;
			}
		});
		if ($scope.obj.id) {
			$http.put(apiBasePath + "api/db/courseparticipants/" + $scope.obj.id, body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "courseparticipants", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/courseparticipants success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/courseparticipants error", response);
				}
			);
		} else {
			$http.post(apiBasePath + "api/db/courseparticipants", body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.id) {
						$scope.obj.id = response.data.id;
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "courseparticipants", true);
						DlrgTla.db.courseparticipants.push($scope.obj);
					}
					$uibModalInstance.close('ok');
					console.log("post api/db/courseparticipants success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("post api/db/courseparticipants error", response);
				}
			);
		}
	};

	$scope.delete = function () 
	{
		if (confirm("Kursteilnehmer wirklich löschen?")) {
			DlrgTla.thinking = "Kursteilnehmer wird gelöscht..."
			$scope.commitFailed = false;

			$http.delete(apiBasePath + "api/db/courseparticipants/" + $scope.obj.id).then(
				function(response) {
					DlrgTla.thinking = "";
					var pos = DlrgTla.db.courseparticipants.map(e => e.id).indexOf($scope.obj.id);
					DlrgTla.db.courseparticipants.splice(pos, 1);
					if (ctrlScopes.courses) ctrlScopes.courses.crCp = null;
					$uibModalInstance.close('ok');
					console.log("delete api/db/courseparticipants success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("delete api/db/courseparticipants error", response);
				}
			);
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgCourseParticipantEditCtrl
