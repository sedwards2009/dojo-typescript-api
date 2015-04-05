/// <reference path="./test_harness.d.ts" />
/// <reference path="../output/dijit.d.ts" />
/// <reference path="../output/doh.d.ts" />

import doh = require("doh/main");
import date = require("dojo/date");
import locale = require("dojo/date/locale");
import lang = require("dojo/_base/lang");
import on = require("dojo/on");
import parser = require("dojo/parser");
import registry = require("dijit/registry");
import DateTextBox = require("dijit/form/DateTextBox");
import domStyle = require("dojo/dom-style");
import domGeometry = require("dojo/dom-geometry");
import query = require("dojo/query");

				// "dijit/form/Form",
				// "dijit/tests/helpers",
				// "dojo/domReady!"
        
        function eventHandler(e){
  				// use this.domNode.getAttribute('widgetId') to show "this" is the widget
  				// mouseleave/enter map to mouseout/over in all browsers except IE
  				console.log(this.domNode.getAttribute('widgetId') + ' ' + e.type);
  			}
        
        function innerText(node: HTMLElement): string {
	// summary:
	//		Browser portable function to get the innerText of specified DOMNode
	return lang.trim(node.textContent || node.innerText || "");
}
function isVisible(/*dijit/_WidgetBase|DomNode*/ node){
	// summary:
	//		Return true if node/widget is visible
	var p;
	if(node.domNode){ node = node.domNode; }
	return (domStyle.get(node, "display") != "none") &&
		(domStyle.get(node, "visibility") != "hidden") &&
		(p = domGeometry.position(node, true), p.y + p.h >= 0 && p.x + p.w >= 0 && p.h && p.w);
}
				// Add test=true to the URL to run unit tests.
				var test = /mode=test/i.test(window.location.href);

				parser.parse();
				
				// See if we can make a widget in script and attach it to the DOM ourselves.
				on(registry.byId('pattern'), "onMouseEnter", eventHandler);
				on(registry.byId('pattern'), "onMouseLeave", eventHandler);
				on(registry.byId('pattern'), "onKeyDown", eventHandler);

				var props = {
					name: "date4",
					value: new Date(2006,10,29),
					constraints: {min:new Date(2004,0,1),max:new Date(2006,11,31)},
					lang: "de-de",
					hasDownArrow: false,
					onMouseEnter: eventHandler,
					onMouseLeave: eventHandler,
					onKeyDown: eventHandler,
					promptMessage: "dd.mm.yy",
					rangeMessage: "Enter a date in the year range 2004-2006.",
					invalidMessage: "Invalid date. Use dd.mm.yy format."
				};
				var german = new DateTextBox(props, "german");
				german.startup();
				var localLong = <dijit.form.DateTextBox> registry.byId("localLong");
				var american = <dijit.form.DateTextBox> registry.byId("american");

				localLong.parse = function(value,constraints){
					return this.dateLocaleModule.parse(value, (constraints.formatLength="long") && constraints) ||
							this.dateLocaleModule.parse(value, (constraints.formatLength="short") && constraints) ||
							(this._isEmpty(value) ? null : undefined);	 // Date
				};

				if(test){
					doh.register("constraints", [
						{
							name: "initial state",
							timeout: 1000,
							runTest: function(t){
								var expected = new Date(2005,11,30);
								var actual = localLong.get('value');
								t.is(0, date.compare(expected, actual), 'expected ' + expected.toDateString() + ' but got ' + actual.toDateString());
								t.is("", localLong.get('state'));
							}
						},
						{
							name: "change value, now invalid",
							timeout: 1000,
							runTest: function(t){
								var expected = new Date(2007,6,15);
								localLong.set("value", expected);
								var actual = localLong.get('value');
								t.is(0, date.compare(expected, actual), 'expected ' + expected.toDateString() + ' but got ' + actual.toDateString());
								t.is("Error", localLong.get('state'));
							}
						},
						{
							name: "change max, still invalid",
							timeout: 1000,
							runTest: function(t){
								localLong.set("constraints", lang.mixin(localLong.get('constraints'), { max: new Date(2007,5,30)}));
								var expected = new Date(2007,6,15);
								var actual = localLong.get('value');
								t.is(0, date.compare(expected, actual), 'expected ' + expected.toDateString() + ' but got ' + actual.toDateString());
								t.is("Error", localLong.get('state'));
							}
						},
						{
							name: "change max, now valid",
							timeout: 1000,
							runTest: function(t){
								localLong.set("constraints", lang.mixin(localLong.get('constraints'), { max: new Date(2007,11,31)}));
								var expected = new Date(2007,6,15);
								var actual = localLong.get('value');
								t.is(0, date.compare(expected, actual), 'expected ' + expected.toDateString() + ' but got ' + actual.toDateString());
								t.is("", localLong.get('state'));
							}
						},
						{
							name: "change max, now invalid",
							timeout: 1000,
							runTest: function(t){
								localLong.set("constraints", lang.mixin(localLong.get('constraints'), { max: new Date(2006,11,30)}));
								var expected = new Date(2007,6,15);
								var actual = localLong.get('value');
								t.is(0, date.compare(expected, actual), 'expected ' + expected.toDateString() + ' but got ' + actual.toDateString());
								t.is("Error", localLong.get('state'));
							}
						},
						{
							name: "change value, now valid",
							timeout: 1000,
							runTest: function(t){
								var expected = new Date(2005,11,30);
								localLong.set("value", expected);
								var actual = localLong.get('value');
								t.is(0, date.compare(expected, actual), 'expected ' + expected.toDateString() + ' but got ' + actual.toDateString());
								t.is("", localLong.get('state'));
							}
						}
					]);

					doh.register("misc",
							function noYear(){
								var widget = <dijit.form.DateTextBox> registry.byId("noyear");
								doh.t(widget.isValid(false), "isValid");
								doh.is(2011, widget.get('value').getFullYear(), "programmatic value");
								doh.is(2011, widget.value.getFullYear(), "JS value");
							},
							function noParams(){
								// Just making sure we don't get an exception when no parameters are specified.
								// new DateTextBox();
							}
					);

					doh.register("API", [
						function initial(){
							// initial conditions
							doh.is(0, date.compare(new Date(2005,11,30), american.get('value')), 'wire value of american: ' + american.get('value'));
							doh.is('12/30/2005', american.get('displayedValue'), 'displayed value of american');
						},

						function setValue(){
							american.set('value', new Date(2004,9,20));
							doh.is(0, date.compare(new Date(2004,9,20), american.get('value')),
									'wire value of american is: ' + american.get('value') +
									' but should be: ' + new Date(2004,9,20));
							doh.is('10/20/2004', american.get('displayedValue'), 'displayed value of american');
							doh.t(american.isValid(), 'marked as valid');
						},

						function setDisplayedValue(){
							american.set('displayedValue', '11/12/2006');
							doh.is(0, date.compare(new Date(2006, 10, 12), american.get('value')), 'wire value of american');
							doh.is('11/12/2006', american.get('displayedValue'), 'displayed value of american');
							doh.t(american.isValid(), 'marked as valid');
						},

						function setInvalidDisplayedValue(){
							american.set('displayedValue', 'foo');
							doh.t(american.get('value') === undefined, 'value is undefined if displayedValue is garbage');
							doh.f(american.isValid(), 'marked as invalid');

							// setting the value to get('value') should never change anything, so
							// therefore setting the value to undefined shouldn't affect the displayed value
							american.set('value', undefined);
							doh.is(american.get('displayedValue'), 'foo');
						},

						function setOutOfRange(){
							// This widget is set to be valid between 2004 and 2006 only
							american.set('displayedValue', '12/1/2008');
							doh.f(american.isValid(), 'marked as invalid since out of range');
							doh.is('12/1/2008', american.get('displayedValue'), 'displayed value of american');
						},

						function noInitialValue(){
							var fromDate = <dijit.form.DateTextBox> registry.byId('fromDate');
							doh.is('', fromDate.get('displayedValue'), 'initially blank');
							doh.is(new Date('').toString(), fromDate.value.toString(), 'default value');
							var d = new doh.Deferred();
							var today = new Date();
							fromDate.set('value', today);
							setTimeout(d.getTestCallback(function(){
								var toDate = <dijit.form.DateTextBox> registry.byId('toDate');
								doh.is(today.toDateString(), fromDate.value.toDateString(), 'changed value');
								// doh.is(today.toDateString(), toDate.constraints.min.toDateString(), 'onChange');
							}), 500);
							return d;
						},

						function ariaRolesAndAttributes(){
							var d = new doh.Deferred(),
									button = <dijit.form.DateTextBox> registry.byId("local");

							doh.is("combobox", button._popupStateNode.getAttribute("role"), "button _popupStateNode role");
							doh.t(button._popupStateNode.getAttribute("aria-haspopup"), "aria-haspopup on button");
							doh.f(button._popupStateNode.getAttribute("aria-expanded"), "initially missing aria-expanded");
							doh.f(button._popupStateNode.getAttribute("aria-owns"), "initally missing aria-owns");

							button.openDropDown();

							setTimeout(d.getTestCallback(function(){
								doh.t(button._popupStateNode.getAttribute("aria-expanded"), "now aria-expanded should be true");
								doh.is("local_popup", button._popupStateNode.getAttribute("aria-owns"), "should aria-own the Dlg");
								// Check roles and attributes on the dialog
								var dlg = registry.byId("local_popup");
								doh.is("grid", dlg.domNode.getAttribute("role"), "Dlg.domNode should have a role");
								doh.is("local_popup_mddb local_popup_year", dlg.domNode.getAttribute("aria-labelledby"), "aria-labelledby should not overwrite existing labelledby for the Calendar");

								button.closeDropDown();
							}), 500);

							return d;
						}
					]);

					doh.register("localization", [
						function initialGerman(){
							doh.is(0, date.compare(new Date(2006,10,29), german.get('value')), 'wire value of german: ' + german.get('value'));
							doh.is('29.11.2006', german.get('displayedValue'), 'displayed value of german');
						},

						function setValueGerman(){
							german.set('value', new Date(2004,9,20));
							doh.is(0, date.compare(new Date(2004,9,20), german.get('value')),
									'wire value of german is: ' + german.get('value') +
									' but should be: ' + new Date(2004,9,20));
							doh.is('20.10.2004', german.get('displayedValue'), 'displayed value of german');
							doh.t(german.isValid(), 'marked as valid');
						},

						function setDisplayedValueGerman(){
							german.set('displayedValue', '12.11.2006');
							doh.is(0, date.compare(new Date(2006, 10, 12), german.get('value')), 'wire value of german');
							doh.is('12.11.2006', german.get('displayedValue'), 'displayed value of german');
							doh.t(german.isValid(), 'marked as valid');
						},
						{
							name: "labels",
							timeout: 6000,
							runTest: function(){
								german.set('value', new Date(2006, 9, 15));	// 10/15/2006

								german.openDropDown();
								var calendar = registry.byId("german_popup");

								// calendar exists and is shown
								doh.t(calendar && isVisible(calendar), "calendar is visible");

								// Month label
								doh.is("Oktober", innerText(query(".dijitCalendarCurrentMonthLabel", calendar.domNode)[0]));

								// Day labels
								var dayLabels = query(".dijitCalendarDayLabelTemplate", calendar.domNode);
								doh.is(7, dayLabels.length, "7 day labels");
								doh.is("M", innerText(dayLabels[0]), "day 0");
								doh.is("D", innerText(dayLabels[1]), "day 1");
								doh.is("M", innerText(dayLabels[2]), "day 2");
								doh.is("D", innerText(dayLabels[3]), "day 3");
								doh.is("F", innerText(dayLabels[4]), "day 4");
								doh.is("S", innerText(dayLabels[5]), "day 5");
								doh.is("S", innerText(dayLabels[6]), "day 6");
								german.closeDropDown();
							}
						}
					]);

					doh.run();
				}
