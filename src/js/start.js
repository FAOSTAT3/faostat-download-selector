/*global define*/
/*jslint nomen: true*/
define([
    'jquery',
    'loglevel',
    'globals/Common',
    'text!fs-s/html/templates.hbs',
    'i18n!fs-s/nls/translate',
    'fs-s/tab',
    'fs-s/summary',
    'faostatapiclient',
    'handlebars',
    'underscore',
    // Add selector
    'bootstrap',
    'amplify'
], function ($, log, Common, template, i18nLabels, Tab, Summary, FAOSTATAPIClient, Handlebars, _) {

    'use strict';

    var s = {

            TABS_LIST: '[data-role="tabs-list"]',
            TABS_CONTENT: '[data-role="tabs-content"]',

            TREE_FILTER: '[data-role="tree-filter"]',
            SUMMARY: '[data-role="summary"]',
            SELECT_ALL: '[data-role="select-all"]',
            DESELECT_ALL: '[data-role="deselect-all"]'

        },

        defaultOptions = {

            multiple: true

    };

    function Selector() {

        return this;

    }

    Selector.prototype.init = function (config) {

        this.o = $.extend(true, {}, defaultOptions, config);
        this.api = new FAOSTATAPIClient();

        log.info('Selector.init;', this.o);

        this.initVariables();
        this.initComponents();
        this.bindEventListeners();

    };

    Selector.prototype.initVariables = function () {

        // TODO: refactor coding system API?
        var coding_systems = this.getCodingSystems();

        this.$CONTAINER = $(this.o.container);

        var html = $(template).filter('#main_structure').html(),
            t = Handlebars.compile(html),
            options = $.extend(true, {}, i18nLabels, {
                is_multiple_selection: this.o.multiple,
                coding_systems: coding_systems
            });

        log.info(i18nLabels);

        // init structure
        this.$CONTAINER.html(t(options));

        this.$SUMMARY = this.$CONTAINER.find(s.SUMMARY);
        this.$TABS_LIST = this.$CONTAINER.find(s.TABS_LIST);
        this.$TABS_CONTENT = this.$CONTAINER.find(s.TABS_CONTENT);
        this.$TREE_FILTER = this.$CONTAINER.find(s.TREE_FILTER);
        this.$SELECT_ALL = this.$CONTAINER.find(s.SELECT_ALL);
        this.$DESELECT_ALL = this.$CONTAINER.find(s.DESELECT_ALL);

    };
    Selector.prototype.getCodingSystems = function() {

        var codes = [],
            id = Math.random().toString().replace('.', ''),
            codingSystems = this.o.dimension.subdimensions[0].coding_systems;

        log.info('here')
        _.each(codingSystems, function(c) {
            codes.push({
                id: id,
                code: c,
                label: c
            });
        });

        return codes.length > 0? codes : null;
     };

    Selector.prototype.createTab = function (subdimension) {

        log.info("Selector.createTab; ", subdimension);

    };

    Selector.prototype.initComponents = function () {

        var subdimensions = this.o.subdimensions,
            self = this;

        this.summary = this.initSummary();
        this.tabs = {};

        // for each subdimension create a tab
        _.each(subdimensions, function(s, index) {

            var tab = self.initTab(s, index);
            self.tabs[tab.getID()] = tab;

        });

        // enable tree filter
        this.enableTreeFilter();

    };

    Selector.prototype.initTab = function (dimension, index) {

        log.info('Selector.initTab;', dimension);

        var id = 'tab_' + Math.random().toString().replace('.', ''),
            htmlTabList = $(template).filter('#tab_header_structure').html(),
            tTabList = Handlebars.compile(htmlTabList),
            htmlTabContent = $(template).filter('#tab_content_structure').html(),
            tTabContent = Handlebars.compile(htmlTabContent),
            multipleSelection = this.o.multiple,
            tab = new Tab(),
            code = this.o.code,
            o = $.extend({
               id: id,
               tab_header_label: dimension.label
            });

        // add tab to the tab list
        this.$TABS_LIST.append(tTabList(o));

        // add tab content
        this.$TABS_CONTENT.append(tTabContent(o));

        tab.init({
            container: this.$TABS_CONTENT.find('#' + id),
            summary: this.summary,
            dimension: dimension,
            code: code,
            id: id,
            multiple: multipleSelection
        });

        // shows the first tab
        this.$TABS_LIST.find('a:first').tab('show');

        return tab;
    };

    Selector.prototype.initSummary = function () {

        var multipleSelection = this.o.multiple;

        this.summary = new Summary();
        this.summary.init({
            container: this.$SUMMARY,
            onRemove: _.bind(this.deselectItem, this),
            multiple: multipleSelection
        });

        return this.summary;
    };

    Selector.prototype.getActiveTab = function() {

        var tabID = this.$TABS_LIST.find("li.active a").data('tab');
        return this.tabs[tabID];

    };

    Selector.prototype.selectAll = function() {

        var tab = this.getActiveTab();

        tab.selectAll();

    };

    Selector.prototype.deselectItem = function(item) {

        log.info("Selector.deselectItem; item:", item);

        for(var key in this.tabs) {
            this.tabs[key].deselect(item);
        }

    };

    Selector.prototype.deselectAll = function() {

        //var tab = this.getActiveTab();
        // deselect only the active tab or all the tabs
        for(var key in this.tabs) {
            this.tabs[key].deselectAll();
        }

        this.summary.deselectAll();

    };

    Selector.prototype.enableTreeFilter = function() {

        var self = this;

        this.$TREE_FILTER.keyup(function (e) {
            setTimeout(function () {
                for(var key in self.tabs) {
                    self.tabs[key].search(self.$TREE_FILTER.val());
                }
            }, 250);
        });

    };

    Selector.prototype.getSelections = function () {

        var codes = this.summary.getSelections(),
            parameter = this.o.parameter,
            id = this.o.id,
            request = {},
            obj = {};

        // TODO: in case of switching to databean, replace request[this.o.parameter] with request.filter;

        request[this.o.parameter] = codes;

        // TODO: coding systems
        //request[this.o.parameter] = codes;

        obj = {
            id: id,
            paramenter: parameter,
            codes: codes,
            request: request
        };

        log.info('Selector.getSelections', obj);

        return obj;

    };

    Selector.prototype.bindEventListeners = function () {

        var self = this;

        this.$SELECT_ALL.on('click', function() {
            self.selectAll();
        });

        this.$DESELECT_ALL.on('click', function() {
            self.deselectAll();
        });

    };

    Selector.prototype.unbindEventListeners = function () {

        this.$SELECT_ALL.off('click');
        this.$DESELECT_ALL.off('click');

    };

    Selector.prototype.destroy = function () {

        log.info('Selector.destroy;');

        this.unbindEventListeners();

        // remove summary and tabs

        this.$CONTAINER.empty();

    };

    return Selector;

});