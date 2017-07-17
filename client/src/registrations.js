
DlrgTlaApp.controller('RegistrationsCtrl', ['$scope', '$uibModal', 'uiGridConstants', function ($scope, $uibModal, uiGridConstants)
{
	$scope.DlrgTla = DlrgTla;
	$scope.table = "registrations";
	$scope.cr = null;
	ctrlScopes[$scope.table] = $scope; // dirty

	$scope.$watch("cr", function(newValue, oldValue) { if (newValue != oldValue) { $scope.cp = DlrgTla.getEntry('participants', $scope.cr.pId); } });

	$scope.isActive = function() {
		return DlrgTla.panel == 'registrations';
	}

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
			{ name: 'Kurstyp', field: 'ctId', width: 120, cellFilter: 'dbfield:"coursetypes":"name"', filterCellFiltered: true, sortCellFiltered: false,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.coursetypes
				},
				sort: { direction: 'asc', priority: 0 }
			},
			{ name: 'Anmeldedatum', field: 'data.date', width: 80, cellFilter: 'date:"dd.MM.yyyy"', filterCellFiltered: true, sortCellFiltered: false },
			{ name: 'Wartezeit', field: 'data.date', width: 70, cellFilter: 'age', filterCellFiltered: true, sortCellFiltered: true },
			{ name: 'Nachname', field: 'pId', width: 100, cellFilter: 'dbfield:"participants":"data.lastName"', filterCellFiltered: true, sortCellFiltered: true,
				sort: { direction: 'asc', priority: 1 } },
			{ name: 'Vorname', field: 'pId', width: 100, cellFilter: 'dbfield:"participants":"data.firstName"', filterCellFiltered: true, sortCellFiltered: true,
				sort: { direction: 'asc', priority: 2 } },
			{ name: 'Alter', field: 'pId', width: 70, cellFilter: 'dbfield:"participants":"getAge"', filterCellFiltered: true, sortCellFiltered: true,
				sortingAlgorithm: function(a, b) { return a==b? 0 : ((a<b)? -1 : 1); },
				filter: {
					condition: uiGridConstants.filter.GREATER_THAN_OR_EQUAL,
					placeholder: "älter als"
				}
			},
			{ name: 'Geb.', field: 'pId', width: 80, cellFilter: 'dbfield:"participants":"data.birthdate" | date:"dd.MM.yyyy"', filterCellFiltered: true, sortCellFiltered: true },
			{ name: 'Status (akt. Saison)', field: 'pId', width: 120, cellFilter: 'courseStatus:true:col.colDef.DlrgTla.sId', filterCellFiltered: true, sortCellFiltered: true,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.courseStatus
				},
				DlrgTla: DlrgTla
			},
			{ name: 'Wunsch', field: 'data.request', width: 120 },
			{ name: 'Notizen', field: 'data.notes' }
		],
		data: 'DlrgTla.db.registrations'
	};

	$scope.gridOptions.onRegisterApi = function(gridApi)
	{
		DlrgTla.uiGrids[$scope.table] = gridApi;
		$scope.gridApi = gridApi;

		$scope.gridApi.selection.on.rowSelectionChanged($scope, function(row) {
			var pos = DlrgTla.db[$scope.table].map(e => e.id).indexOf(row.entity.id);
			$scope.cr = DlrgTla.db[$scope.table][pos];
		});
	}

	$scope.getMailAdresses = function()
	{
		var filtered = $scope.gridApi.core.getVisibleRows($scope.gridApi.grid);
		var entities = _.map(filtered, 'entity'); // Entities extracted from the GridRow array
		var mailStr = "";
		var mails = {};

		angular.forEach(entities, function(e) {
			//console.log(e, e.pId);
			var p = DlrgTla.getEntry("participants", e.pId);
			if (p.data.email && !mails[p.data.email]) {
				mailStr = mailStr + p.data.email + ";"
				mails[p.data.email] = true;
			}
			if (p.data.altEmail && !mails[p.data.altEmail]) {
				mailStr = mailStr + p.data.altEmail + ";"
				mails[p.data.altEmail] = true;
			}
		});
		return mailStr;
	}
	
}]); // ParticipantsCtrl

DlrgTlaApp.controller('DlgRegistrationEditCtrl', function ($scope, $uibModalInstance, $http, registration, pId)
{
	$scope.DlrgTla = DlrgTla;

	$scope.registration = registration;
	if (!$scope.registration) {
		$scope.registration = { pId: pId, ctId: -1, data: { date: (new Date()).toISOString().split("T")[0] } };
		DlrgTla.resetData($scope.registration, "registrations");
	}
	
	if (registration) {
		$scope.modalTitle = "Anmeldung bearbeiten";
	} else {
		$scope.modalTitle = "Neue Anmeldung erfassen";
	}

	$scope.ok = function () 
	{
		if ($scope.registration.ctId == -1) {
			$scope.missingCourse = true;
			return;
		}
		$scope.missingCourse = false;

		DlrgTla.thinking = "Anmeldung wird gespeichert..."
		$scope.commitFailed = false;
		DlrgTla.setDataEnc($scope.registration);

		var body = {};
		angular.forEach($scope.registration, function(v, k) {
			if (!k.startsWith("_") && k != "data") {
				body[k] = v;
			}
		});
		if ($scope.registration.id) {
			$http.put(apiBasePath + "api/db/registrations/" + $scope.registration.id, body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.registration.changedAt = response.data.changedAt;
						$scope.registration.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.registration, "registrations", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/registrations success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/registrations error", response);
				}
			);
		} else {
			$http.post(apiBasePath + "api/db/registrations", body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.id) {
						$scope.registration.id = response.data.id;
						$scope.registration.changedAt = response.data.changedAt;
						$scope.registration.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.registration, "registrations", true);
						DlrgTla.db.registrations.push($scope.registration);
					}
					$uibModalInstance.close('ok');
					console.log("post api/db/registrations success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("post api/db/registrations error", response);
				}
			);
		}
	};

	$scope.delete = function () 
	{
		if (confirm("Anmeldung wirklich löschen?")) {
			DlrgTla.thinking = "Anmeldung wird gelöscht..."
			$scope.commitFailed = false;

			$http.delete(apiBasePath + "api/db/registrations/" + $scope.registration.id).then(
				function(response) {
					DlrgTla.thinking = "";
					var pos = DlrgTla.db.registrations.map(e => e.id).indexOf($scope.registration.id);
					DlrgTla.db.registrations.splice(pos, 1);
					if (ctrlScopes.registrations) ctrlScopes.registrations.cr = null;
					$uibModalInstance.close('ok');
					console.log("delete api/db/registrations success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("delete api/db/registrations error", response);
				}
			);
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgRegistrationEditCtrl