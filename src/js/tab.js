/*global define, amplify*/
/*jslint nomen: true*/
define([
    'jquery',
    'loglevel',
    'config/Config',
    'config/Events',
    'globals/Common',
    'text!fs-s/html/templates.hbs',
    'faostatapiclient',
    // Add selector
    'jstree',
    'underscore',
    'amplify'
], function ($, log, C, E, Common, template, FAOSTATAPIClient, Tree, _) {

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
        this.api = new FAOSTATAPIClient();
        this.summary = this.o.summary;

        log.info('Tab.init;', this.o);

        this.initVariables();
        this.initComponents();

    };

    Tab.prototype.initVariables = function () {

        log.info('Tab.initVariables;', this.o);

        this.$CONTAINER = $(this.o.container);

        this.$TREE = this.$CONTAINER.find(s.TREE);

    };

    Tab.prototype.initComponents = function () {

        var id = this.o.dimension.id,
            domain_code = this.o.code,
            // TODO: report_code should came from the dimension API?
            report_code = this.o.report_code || null,
            self = this;

        // retrieve all codes for the subdimension
        this.api.codes({
            datasource: C.DATASOURCE,
            lang: Common.getLocale(),
            id: id,
            domain_code: domain_code,
            report_code: report_code,
            // TODO: this should be optional
            whitelist: [],
            blacklist: [],
            subcodelists: null,
            show_lists: true,
            ord: null
        }).then(function(d) {

            if (d.data.length > 0) {
                self.initTree(d);
            }
            else {
                // TODO: make it nice
                self.$TREE.html('<h5 style="text-align: center;">No selection available</h5>');
            }

            //self.initTree(d);

        });

    };

    Tab.prototype.initTree = function (d) {

        log.info("Tab.initTree; ", this.o);

        var data = this.prepareTreeData(d),
            //multiple = this.o.multiple,
            // TODO: make it nicer and robust
            multiple = (this.o.dimension.options.selectType === 'multi'),
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

         this.$TREE.on('ready.jstree', function (e) {

        });

    };

    Tab.prototype.prepareTreeData = function (d) {

        var data = [];

        _.each(d.data, function(v) {
            data.push({
                id: v.code + '_' + v.aggregate_type,
                text: v.label,
                li_attr: {
                    code: (v.aggregate_type === '>')? v.code + v.aggregate_type: v.code,
                    label: v.label
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

    Tab.prototype.destroy = function () {

        log.info('Tab.destroy;');

    };

    return Tab;

});