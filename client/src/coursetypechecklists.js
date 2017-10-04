
DlrgTlaApp.controller('CoursetypechecklistsCtrl', ['$scope', '$uibModal', 'uiGridConstants', function ($scope, $uibModal, uiGridConstants)
{
	$scope.DlrgTla = DlrgTla;
	$scope.table = "coursetypechecklists";
	$scope.cr = null;
	ctrlScopes[$scope.table] = $scope; // dirty

	$scope.isActive = function() {
		return DlrgTla.panel == 'coursetypechecklists';
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
			{ name: 'Sortierung', field: 'order', width: 50, type: "number", sort: { direction: 'asc', priority: 1 } },
			{ name: 'Leistung', field: 'item' }
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
		});
	}
	
}]); // CoursetypechecklistsCtrl

DlrgTlaApp.controller('DlgCoursetypechecklistEditCtrl', function ($scope, $uibModalInstance, $http, $timeout, item, ctId, order, copyFromItem)
{
	$scope.DlrgTla = DlrgTla;

	$scope.item = item;
	if (!$scope.item) {
		$scope.item = { ctId: ctId, order: order ? order : 10 };

		if (copyFromItem) {
			$scope.item.ctId = copyFromItem.ctId;
			$scope.item.item = copyFromItem.item;
			$scope.item.order = copyFromItem.order;
		}

		DlrgTla.resetData($scope.item, "coursetypechecklists");
	}
	
	if (item) {
		$scope.modalTitle = "Leistung bearbeiten";
	} else {
		$scope.modalTitle = "Neue Leistung erfassen";
	}

	$scope.ok = function () 
	{
		if ($scope.item.ctId == -1) {
			$scope.missingCourse = true;
			return;
		}
		$scope.missingCourse = false;

		DlrgTla.thinking = "Leistung wird gespeichert..."
		$scope.commitFailed = false;

		var body = {};
		angular.forEach($scope.item, function(v, k) {
			if (!k.startsWith("_") && k != "data") {
				body[k] = v;
			}
		});
		if ($scope.item.id) {
			$http.put(apiBasePath + "api/db/coursetypechecklists/" + $scope.item.id, body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.changed) {
						$scope.item.changedAt = response.data.changedAt;
						$scope.item.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.item, "coursetypechecklists", true);
					}
					$uibModalInstance.close('ok');
					console.log("put api/db/coursetypechecklists success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("put api/db/coursetypechecklists error", response);
				}
			);
		} else {
			$http.post(apiBasePath + "api/db/coursetypechecklists", body).then(
				function(response) {
					DlrgTla.thinking = "";
					if (response.data && response.data.id) {
						$scope.item.id = response.data.id;
						$scope.item.changedAt = response.data.changedAt;
						$scope.item.changedBy = response.data.changedBy;
						DlrgTla.resetData($scope.item, "coursetypechecklists", true);
						DlrgTla.db.coursetypechecklists.push($scope.item);
						$scope.cr = $scope.item;
						$timeout(function() { 
							DlrgTla.uiGrids.coursetypechecklists.selection.selectRow($scope.cr);
							DlrgTla.uiGrids.coursetypechecklists.core.scrollTo($scope.cr);
						}, 0);
					}
					$uibModalInstance.close('ok');
					console.log("post api/db/coursetypechecklists success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("post api/db/coursetypechecklists error", response);
				}
			);
		}
	};

	$scope.delete = function () 
	{
		if (confirm("Leistung wirklich löschen?")) {
			DlrgTla.thinking = "Leistung wird gelöscht..."
			$scope.commitFailed = false;

			$http.delete(apiBasePath + "api/db/coursetypechecklists/" + $scope.item.id).then(
				function(response) {
					DlrgTla.thinking = "";
					var pos = DlrgTla.db.coursetypechecklists.map(e => e.id).indexOf($scope.item.id);
					DlrgTla.db.coursetypechecklists.splice(pos, 1);
					if (ctrlScopes.coursetypechecklists) ctrlScopes.coursetypechecklists.cr = null;
					$uibModalInstance.close('ok');
					console.log("delete api/db/coursetypechecklists success", response);
				},
				function(response) {
					DlrgTla.thinking = "";
					$scope.commitFailed = true;
					console.log("delete api/db/coursetypechecklists error", response);
				}
			);
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};
}) // DlgCoursetypechecklistEditCtrl