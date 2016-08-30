/*global define, amplify*/
/*jslint nomen: true*/
define([
    'jquery',
    'loglevel',
    'config/Events',
    'text!fs-s/html/templates.hbs',
    'faostatapiclient',
    // Add selector
    'jstree',
    'underscore',
    'underscore.string',
    'amplify'
], function ($, log, E, template, API, Tree, _, _s) {

    'use strict';

    var s = {

            TREE: '[data-role="tree"]'

        },

        defaultOptions = {

            // coding system

            // summary

            // tabs

            // each tab

            // single or multiple selection tree

        };

    function Tab() {

        return this;

    }

    Tab.prototype.init = function (config) {

        this.o = $.extend(true, {}, defaultOptions, config);
        this.summary = this.o.summary;
        this.cache = {};

        //log.info('Tab.init;', this.o);

        this.initVariables();
        this.initComponents();

    };

    Tab.prototype.initVariables = function () {

        //log.info('Tab.initVariables;', this.o);

        this.$CONTAINER = $(this.o.container);

        this.$TREE = this.$CONTAINER.find(s.TREE);

        amplify.publish(E.LOADING_SHOW, { container: this.$TREE });

    };

    Tab.prototype.initComponents = function () {

        var id = this.o.dimension.id,
            domain_code = this.o.code,
            // TODO: report_code should came from the dimension API?
            report_code = this.o.report_code || null,
            self = this;

        // retrieve all codes for the subdimension
        API.codes({
            id: id,
            domain_code: domain_code,
            report_code: report_code,
            show_lists: true
        }).then(function(d) {

            if (d.data.length > 0) {
                self.initTree(d);
            }
            else {
                // TODO: make it multilingual and nicer
                self.$TREE.html('<h5 style="text-align: center;">No selection available</h5>');
            }

        });

    };

    Tab.prototype.initTree = function (d) {

        //log.info("Tab.initTree; ", this.o);
        //log.info("Tab.initTree; ", d.data);

        this.cache.data = $.extend(true, {}, d.data);

        var data = this.prepareTreeData(d),
        //multiple = this.o.multiple,
        // TODO: make it nicer and robust
            multiple = (this.o.dimension.options.selectType === 'multi'),
        // in case is it a single node it will be selected automatically if the tab is visible
            isSingleNode = d.data.length === 1? true: false,
            self = this;

        /* Init JSTree. */
        this.$TREE.jstree({

            'plugins': ['checkbox', 'unique', 'search', 'striped', 'types', 'wholerow'],

            'core': {
                'multiple': multiple,
                'data': data,
                'themes': {
                    'stripes': true,
                    'icons': false
                }
            },

            'search': {
                'show_only_matches': true,
                'close_opened_onclear': false
            }

        });

        // Binding on node selection
        this.$TREE.on('select_node.jstree', function (e, data) {

            self.summary.add([data.node.li_attr]);

        });

        this.$TREE.on('deselect_node.jstree', function (e, data) {

            self.summary.remove(data.node.li_attr);

        });

        this.$TREE.on('ready.jstree', function (e, data) {

            // in case is it a single node it will be selected automatically if the tab is visible
            if(self.$TREE.is(":visible") && isSingleNode) {
                self.$TREE.jstree('select_node', 'ul > li:first');
            }

            // refresh summary
            self.refreshSummary();

            // callback
            if(self.o.callback !== undefined && _.isFunction(self.o.callback)) {
                self.o.callback(self);
            }

        });

    };

    Tab.prototype.prepareTreeData = function (d) {

        var data = [];

        _.each(d.data, function(v) {

            var id = v.code + '_' + v.aggregate_type,
                // fix for DB aggregation type missing fix
                code = (v.aggregate_type === '>' && !_.include(v.code, ">"))? v.code + v.aggregate_type: v.code,
                label = v.label;

            data.push({
                id: id,
                text: label,
                li_attr: {
                    code: code,
                    label: label
                },
                state: {
                    //selected: true  // is the node selected
                }
            });
        });

        return data;
    };

    Tab.prototype.refreshSummary = function () {

        var selected = this.$TREE.jstree("get_selected"),
            self = this,
            values = [];

        _.each(selected, function(s) {

            var node = self.$TREE.jstree(true).get_node(s);

            values.push(node.li_attr);

        });

        this.summary.add(values);

    };

    Tab.prototype.selectAll = function () {

        this.$TREE.jstree("check_all");

        this.refreshSummary();

    };

    Tab.prototype.deselectAll = function () {

        this.$TREE.jstree("uncheck_all");

    };

    Tab.prototype.select = function (item) {

        //this.$TREE.jstree("check_node", value.id);

    };

    Tab.prototype.deselect = function (item) {

        log.info("Tab.deselect; item:", item);

        this.$TREE.jstree("uncheck_node", item.id);

    };

    Tab.prototype.getID = function () {

        return this.o.id;

    };

    Tab.prototype.search = function (word) {

        this.$TREE.jstree(true).search(word);

    };

    Tab.prototype.getFirstValue = function () {
        
        if (this.cache !== undefined && this.cache.hasOwnProperty('data')) {
            if ( this.cache.data[0] !== undefined ) {
                return this.cache.data[0].label;
            }
        }

    };

    Tab.prototype.destroy = function () {

        log.info('Tab.destroy;');

    };

    return Tab;

});