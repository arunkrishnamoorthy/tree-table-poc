/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"compoc/treetablepoc/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
