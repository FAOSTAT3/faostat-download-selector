/*global define, amplify*/
/*jslint nomen: true*/
define([
    'jquery',
    'loglevel',
    'config/Events',
    'text!fs-s/html/templates.hbs',
    'handlebars',
    'underscore'
], function ($, log, E, template, Handlebars, _) {

    'use strict';

    var s = {

            SUMMARY_ITEM: '[data-role="summary-item"]'

        },

        defaultOptions = {

            onRemove: 'callbak',

            // validate if there is at least one selection
            validateEmptySelection: true,

            multiple: true

    };

    function Summary() {

        return this;

    }

    Summary.prototype.init = function (config) {

        this.o = $.extend(true, {}, defaultOptions, config);

        log.info('Summary.init;', this.o);

        this.initVariables();
        this.initComponents();

    };

    Summary.prototype.initVariables = function () {

        this.$CONTAINER = $(this.o.container);

        // selections
        this.selections = {};

    };

    Summary.prototype.initComponents = function () {

    };

    Summary.prototype.render = function () {

        var html = $(template).filter('#summary_item').html(),
            t = Handlebars.compile(html);

        this.$CONTAINER.html(t({items: this.selections}));

        this.bindEventListeners();

        amplify.publish(E.DOWNLOAD_SELECTION_CHANGE);

    };

    Summary.prototype.add = function (items) {

        var self = this;

        // if single selection enabled, reset selections
        if ( this.o.multiple === false) {
            self.selections = {};
        }

        _.each(items, function (v) {
            self.selections[v.id] = v;
        });

        this.render();

    };

    Summary.prototype.remove = function (item) {

        log.info('Summary.remove;', item);

        delete this.selections[item.id];

        this.render();

        this.o.onRemove(item);

    };

    Summary.prototype.deselectAll = function () {

        this.selections = {};

        this.render();

    };

    Summary.prototype.getSelections = function () {

        var codes = [],
            self = this;

        log.info('Summary.getSelections; this.selections.length:', this.selections.length);

        if ( !_.isEmpty(this.selections)) {
            _.each(Object.keys(this.selections), function(id) {
                codes.push(self.selections[id].code);
            });
        }
        else {
            if ( this.o.validateEmptySelection ) {

                // TODO: there could be an event with a timer "lock"
                $("html, body").animate({ scrollTop: this.$CONTAINER.parent().parent().parent().parent().parent().offset().top}, "slow");
                //$('html, body').animate({ scrollTop: this.$CONTAINER.parent().parent().offset().top }, 'slow');
                this.$CONTAINER.html('<h5 style="color:red">*Please make at least one selection</h5>');
            }
        }

        log.info('Summary.getSelections; codes:', codes);

        return codes;

    };

    Summary.prototype.bindEventListeners = function () {

        var self = this;

        this.$CONTAINER.find(s.SUMMARY_ITEM).on('click', function(e) {

            var id = $(e.target).data('id');

            self.remove({
                id: id
            });

            $(e.target).remove();

        });

    };

    Summary.prototype.unbindEventListeners = function () {

        this.$CONTAINER.find(s.SUMMARY_ITEM).off('click');

    };

    Summary.prototype.destroy = function () {

        log.info('Summary.destroy;');

        this.unbindEventListeners();

        this.$CONTAINER.empty();

    };

    return Summary;

});