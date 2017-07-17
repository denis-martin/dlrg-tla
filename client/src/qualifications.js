
var qualificationsCtrlScope = null;

DlrgTlaApp.controller('QualificationsCtrl', ['$scope', '$uibModal', 'uiGridConstants', function ($scope, $uibModal, uiGridConstants)
{
	$scope.DlrgTla = DlrgTla;
	$scope.table = "qualifications";
	$scope.cr = null;
	ctrlScopes[$scope.table] = $scope; // dirty

	$scope.isActive = function() {
		return DlrgTla.panel == 'qualifications';
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
			{ name: 'Qualifikation', field: 'qtId', width: 120, type: "number", cellFilter: 'dbfield:"qualificationtypes":"name"', 
				filterCellFiltered: true, sortCellFiltered: false,
				filter: {
					type: uiGridConstants.filter.SELECT,
					selectOptions: DlrgTla.uiGridSelectOptions.qualificationtypes
				},
				sort: { direction: 'asc', priority: 2 }
			},
			{ name: 'Nachname', field: 'pId', width: 100, cellFilter: 'dbfield:"participants":"data.lastName"', 
				filterCellFiltered: true, sortCellFiltered: true, sort: { direction: 'asc', priority: 0 } },
			{ name: 'Vorname', field: 'pId', width: 100, cellFilter: 'dbfield:"participants":"data.firstName"', 
				filterCellFiltered: true, sortCellFiltered: true, sort: { direction: 'asc', priority: 1 } },
			{ name: 'Datum', field: 'data.date', width: 80, cellFilter: 'date:"dd.MM.yyyy"', filterCellFiltered: true, sortCellFiltered: false },
			{ name: 'Gültig bis', field: 'data.expiryDate', width: 80, cellFilter: 'date:"dd.MM.yyyy"', filterCellFiltered: true, sortCellFiltered: false },
			{ name: 'Registriernummer', field: 'data.regno', width: 130 },
			{ name: 'Notizen', field: 'data.notes' }
		],
		data: 'DlrgTla.db.qualifications'
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
}]); // QualificationsCtrl

DlrgTlaApp.controller('DlgQualificationEditCtrl', function ($scope, $uibModalInstance, $http, obj, pId)
{
	$scope.DlrgTla = DlrgTla;

	$scope.obj = obj;
	if (!$scope.obj) {
		$scope.obj = { pId: pId, qtId: -1, data: { date: (new Date()).toISOString().split("T")[0], status: 0 } };
		DlrgTla.resetData($scope.obj, "qualifications");
	}
	
	if (obj) {
		$scope.modalTitle = "Qualifikation bearbeiten";
	} else {
		$scope.modalTitle = "Neue Qualifikation erfassen";
	}

	$scope.ok = function () 
	{
		if ($scope.obj.qtId == -1) {
			$scope.missingQualificationType = true;
			return;
		}
		$scope.missingQualificationType = false;

		DlrgTla.thinking = "Qualifikation wird gespeichert..."
		$scope.commitFailed = false;
		DlrgTla.setDataEnc($scope.obj);

		var body = {};
		angular.forEach($scope.obj, function(v, k) {
			if (!k.startsWith("_") && k != "data") {
				body[k] = v;
			}
		});
		if ($scope.obj.id) {
			$http.put(apiBasePath + "api/db/qualifications/" + $scope.obj.id, body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "qualifications", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/qualifications success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/qualifications error", response);
				}
			);
		} else {
			$http.post(apiBasePath + "api/db/qualifications", body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.id) {
						$scope.obj.id = response.data.id;
						$scope.obj.changedAt = response.data.changedAt;
						$scope.obj.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.obj, "qualifications", true);
						DlrgTla.db.qualifications.push($scope.obj);
					}
					$uibModalInstance.close('ok');
					console.log("post api/db/qualifications success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("post api/db/qualifications error", response);
				}
			);
		}
	};

	$scope.delete = function () 
	{
		if (confirm("Qualifikation wirklich löschen?")) {
			DlrgTla.thinking = "Qualifikation wird gelöscht..."
			$scope.commitFailed = false;

			$http.delete(apiBasePath + "api/db/qualifications/" + $scope.obj.id).then(
				function(response) {
					DlrgTla.thinking = "";
					var pos = DlrgTla.db.qualifications.map(e => e.id).indexOf($scope.obj.id);
					DlrgTla.db.qualifications.splice(pos, 1);
					if (ctrlScopes.qualifications) ctrlScopes.qualifications.cr = null;
					$uibModalInstance.close('ok');
					console.log("delete api/db/qualifications success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("delete api/db/qualifications error", response);
				}
			);
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgQualificationsEditCtrl
