/*global define, _*/
/*jslint nomen: true*/
define(['jquery',
        'loglevel',
        'handlebars',
        'globals/Common',
        'text!faostat_ui_download_selector/html/templates.hbs',
        'i18n!faostat_ui_download_selector/nls/translate',
        'faostatapiclient',
        'sweetAlert',
        'bootstrap',
        'jstree'], function ($, log, Handlebars, Common, templates, translate, FAOSTATAPIClient) {

    'use strict';

    function SELECTOR() {

        this.CONFIG = {
            placeholder_id: 'placeholder',
            suffix: 'area',
            rendered: false,

            // TODO: multiple and show_lists should be the same thing?
            multiple: true,
            show_lists: true,

            tabs:   [
                {
                    label: 'Test',
                    id: 'countries',
                    domain_code: 'qc'
                }
            ],
            selector_buffer: [],
            /* Events to destroy. */
            callback: {
                onSelectionChange: null
            }
        };

    }

    SELECTOR.prototype.init = function (config) {

        log.info('SELECTOR.init; config', config);

        /* Variables. */
        var that = this, source, template, dynamic_data, html, tab_idx, coding_systems = [];

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Initiate FAOSTAT API's client. */
        this.CONFIG.api = new FAOSTATAPIClient();

        /* Coding systems. */
        for (tab_idx = 0; tab_idx < this.CONFIG.tabs[0].coding_systems.length; tab_idx += 1) {
            coding_systems.push({
                code: this.CONFIG.tabs[0].coding_systems[tab_idx],
                label: this.CONFIG.tabs[0].coding_systems[tab_idx],
                suffix: this.CONFIG.suffix
            });
        }

        /* Load main structure. */
        source = $(templates).filter('#main_structure').html();
        template = Handlebars.compile(source);
        dynamic_data = {
            tab_headers_id: 'tab_headers_' + this.CONFIG.suffix,
            tab_contents_id: 'tab_contents_' + this.CONFIG.suffix,
            go_to_label: translate.go_to,
            clear_all_label: translate.clear_all,
            select_all_label: translate.select_all,
            select_all_button_id: 'select_all_button_' + this.CONFIG.suffix,
            clear_all_button_id: 'clear_all_button_' + this.CONFIG.suffix,
            search_id: 'search_' + this.CONFIG.suffix,
            summary_id: 'summary_' + this.CONFIG.suffix,
            summary_label: translate.summary,
            coding_systems: coding_systems,
            has_coding_systems: coding_systems.length > 0,
            is_multiple_selection: this.CONFIG.multiple

        };
        html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Add tab headers and contents. */
        for (tab_idx = 0; tab_idx < this.CONFIG.tabs.length; tab_idx += 1) {
            this.add_tab_header(tab_idx, this.CONFIG.tabs[tab_idx].label);
            this.add_tab_content(tab_idx);
            this.bind_search(tab_idx);
        }
        this.load_codelist();

        /* Rendered. */
        this.CONFIG.rendered = true;

        /* Bind select all functions. */
        $('#select_all_button_' + this.CONFIG.suffix).off();
        $('#select_all_button_' + this.CONFIG.suffix).click(function () {
            that.select_all();
        });

        /* Bind clear all functions. */
        $('#clear_all_button_' + this.CONFIG.suffix).off();
        $('#clear_all_button_' + this.CONFIG.suffix).click(function () {
            that.clear_all();
        });

        /* Show the first tab. */
        $($('#tab_headers_' + this.CONFIG.suffix).find('a')[0]).tab('show');

    };

    SELECTOR.prototype.load_codelist = function () {

        /* This... */
        var that = this;

        /* Fetch codes. */
        this.CONFIG.api.codes({
            domain_code: this.CONFIG.tabs[0].domain_code,
            lang: Common.getLocale(),
            id: this.CONFIG.tabs[0].group_id,
            subcodelists: null,
            ord: null,
            show_lists: this.CONFIG.show_lists,
            group_subdimensions: true
        }).then(function (json) {
            var i;
            for (i = 0; i < that.CONFIG.tabs.length; i += 1) {
                that.populate_codelist(json.data[i], i);
            }
        });

    };

    SELECTOR.prototype.isRendered = function () {
        return this.CONFIG.rendered;
    };

    SELECTOR.prototype.isNotRendered = function () {
        return !this.CONFIG.rendered;
    };

    SELECTOR.prototype.add_tab_header = function (tab_idx, tab_header_label) {
        var source, template, dynamic_data, html;
        source = $(templates).filter('#tab_header_structure').html();
        template = Handlebars.compile(source);
        dynamic_data = {
            role_id: 'role_' + this.CONFIG.suffix + '_' + tab_idx,
            tab_header_label: tab_header_label
        };
        html = template(dynamic_data);
        $('#tab_headers_' + this.CONFIG.suffix).append(html);
    };

    SELECTOR.prototype.add_tab_content = function (tab_idx) {
        var source, template, dynamic_data, html;
        source = $(templates).filter('#tab_content_structure').html();
        template = Handlebars.compile(source);
        dynamic_data = {
            id: 'role_' + this.CONFIG.suffix + '_' + tab_idx,
            content_id: 'content_' + this.CONFIG.suffix + '_' + tab_idx
        };
        html = template(dynamic_data);
        $('#tab_contents_' + this.CONFIG.suffix).append(html);
    };

    SELECTOR.prototype.populate_codelist = function (db_response, tab_idx) {

        /* Data and variables. */
        var json = db_response.data,
            payload,
            i,
            multiple = this.CONFIG.multiple,
            that = this;

        /* Cast array to objects */
        payload = [];
        for (i = 0; i < json.length; i += 1) {
            payload.push({
                id: json[i].code + '_' + json[i].aggregate_type,
                text: json[i].label,
                li_attr: {
                    code: json[i].code,
                    type: json[i].aggregate_type,
                    label: json[i].label,
                    tab_idx: tab_idx
                }
            });
        }

        /* Init JSTree. */
        this.CONFIG.tree = $('#content_' + this.CONFIG.suffix + '_' + tab_idx);
        this.CONFIG.tree.jstree({

            'plugins': ['checkbox', 'unique', 'search', 'striped', 'types', 'wholerow'],

            'core': {
                'multiple' : multiple,
                'data': payload,
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

        /* Bind select function. */
        this.CONFIG.tree.on('changed.jstree', function (event, data) {

            log.info('SELECTOR; changed.jstree', event, data)
            log.info('SELECTOR; Multiselection', $(this).jstree().settings);

            try {
                var box_id, tab_id, q;
                tab_id = this.id.charAt(this.id.length - 1);
                box_id = this.id.charAt(9);

                that.summary_listener(data, box_id, tab_id, $(this).jstree().settings.core.multiple);

                if (that.CONFIG.callback.onSelectionChange) {
                    that.CONFIG.callback.onSelectionChange();
                }


                /* Remove an item from the summary by clicking on the listbox. */
                if (data.action === 'deselect_node') {
                    /*global document*/
                    try {
                        document.getElementById(data.node.id + '_' + box_id).remove();
                        for (q = that.CONFIG.selector_buffer['#summary_' + that.CONFIG.suffix].length - 1; q >= 0; q -= 1) {
                            if (data.node.id === that.CONFIG.selector_buffer['#summary_' + that.CONFIG.suffix][q].id) {
                                that.CONFIG.selector_buffer['#summary_' + that.CONFIG.suffix].splice(q, 1);
                            }
                        }
                    } catch (ignore) {

                    }
                }

                log.info(that.CONFIG.selector_buffer);


            } catch (e) {
                //console.debug(e);
            }
        });

    };

    /*
        Use Underscore to determine wheter the array of objects contains an object with the ID equals to
        the one of the selected JSTree's node.
     */
    SELECTOR.prototype.no_object_with_the_same_key = function (selected_node) {
        return _.find(this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix], function (item) {
            return item.id === selected_node;
        }) === undefined;
    };

    SELECTOR.prototype.find_selected_item = function (item_code) {
        return _.find(this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix], function (item) {
            return item.id === item_code;
        });
    };

    SELECTOR.prototype.summary_listener = function (data, box_id, tab_id, multiSelection) {

        /*
            Initiate selector's buffer. This buffer contains all the selected JSTree nodes selected by the user for
            a given box, e.g. Areas. This is used to enable cross-tabs selection.
        */

        log.info('SELECTOR.summary_listener; multiselection', multiSelection)

        if (multiSelection === false || this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix] === undefined) {
            this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix] = [];
        }

        /* Initiate variables. */
        var s = '', source, template, dynamic_data, i, that = this;
        source = $(templates).filter('#summary_item').html();
        template = Handlebars.compile(source);
        dynamic_data = {};

        /* Add selected items to the buffer. */
        for (i = 0; i < data.selected.length; i += 1) {
            if (this.no_object_with_the_same_key(data.selected[i])) {
                this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix].push(data.instance.get_node(data.selected[i]));
            }
        }

        /* Iterate over selected items. */
        for (i = 0; i < this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix].length; i += 1) {
            dynamic_data = {
                click_to_remove_label: translate.click_to_remove,
                summary_item_type: this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix][i].li_attr.type,
                summary_item_code: this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix][i].li_attr.code,
                summary_item_label: this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix][i].li_attr.label,
                summary_item_id: this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix][i].li_attr.id + this.CONFIG.suffix,
                box_id: box_id,
                tab_id: this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix][i].li_attr.tab_idx
            };
            s += template(dynamic_data);
        }

        /* Show selected items in the summary. */
        $('#summary_' + this.CONFIG.suffix).empty().html(s);

        /* Remove item on click. */
        $('.summary-item').off();
        $('.summary-item').click(function () {

            /* Un-select JSTree node. */
            var local_box_id, local_tab_id, tree_id, item_id, selected_item, selected_item_idx;
            local_box_id = $(this).data('box');
            local_tab_id = $(this).data('tab');
            tree_id = 'content__' + local_box_id + '_' + local_tab_id;
            item_id = this.id.substring(0, this.id.length - 2);
            $('#' + tree_id).jstree(true).deselect_node("[id='" + item_id + "']");

            /* Remove item from the buffer. */
            selected_item = that.find_selected_item(item_id);
            selected_item_idx = that.CONFIG.selector_buffer['#summary_' + that.CONFIG.suffix].indexOf(selected_item);
            that.CONFIG.selector_buffer['#summary_' + that.CONFIG.suffix].splice(selected_item_idx, 1);

            /* Remove item from the summary. */
            /*global document*/
            try {
                document.getElementById(this.id).remove();
            } catch (ignore) {

            }

        });

        /* Add user' onSelectionChange callback. */
        if (this.CONFIG.callback.onSelectionChange) {
            this.CONFIG.callback.onSelectionChange();
        }

    };

    SELECTOR.prototype.bind_search = function (tab_idx) {
        var to = false, that = this;
        $('#search_' + this.CONFIG.suffix).keyup(function () {
            if (to) {
                /*global clearTimeout*/
                clearTimeout(to);
            }
            /*global setTimeout*/
            setTimeout(function () {
                var v = $('#search_' + that.CONFIG.suffix).val();
                $('#content_' + that.CONFIG.suffix + '_' + tab_idx).jstree(true).search(v);
            }, 250);
        });
    };

    SELECTOR.prototype.active_tab_idx = function () {
        var tab_idx = $('ul#tab_headers_' + this.CONFIG.suffix + ' li.active').attr('role');
        return tab_idx.charAt(tab_idx.length - 1);
    };

    SELECTOR.prototype.select_all = function () {
        var tab_idx = this.active_tab_idx();
        $('#content_' + this.CONFIG.suffix + '_' + tab_idx).jstree('check_all');
    };

    SELECTOR.prototype.create_select_all_object = function () {
        var obj = $('#summary_' + this.CONFIG.suffix), source, template, dynamic_data;
        obj.empty();
        source = $(templates).filter('#summary_item').html();
        template = Handlebars.compile(source);
        dynamic_data = {
            summary_item_type: 'type',
            summary_item_id: 'id',
            summary_item_code: 'code',
            summary_item_label: 'All Countries'
        };
        obj.html(template(dynamic_data));
    };

    SELECTOR.prototype.clear_all = function () {
        var i;
        for (i = 0; i < this.CONFIG.tabs.length; i += 1) {
            $('#content_' + this.CONFIG.suffix + '_' + i).jstree('deselect_all');
        }
        $('#summary_' + this.CONFIG.suffix).empty();
        this.CONFIG.selector_buffer['#summary_' + this.CONFIG.suffix] = [];
    };

    SELECTOR.prototype.get_user_selection = function (type) {
        var out = [],
            type = type || 'standard',
            divs,
            i,
            code;


        divs = $('#summary_' + this.CONFIG.suffix + ' div');
        for (i = 0; i < divs.length; i += 1) {

            code = $(divs[i]).data('code');

            log.info(code, $(divs[i]).data('code'))
            log.info(divs[i].id.indexOf('>'))

            // TODO: this check on the aggregation should be handled by the API or the DB with the right code
            if (divs[i].id.indexOf('>') > -1) {
                code += '>';
            }

            out.push(code);
        }

        if ( type === 'obj') {
            return {
                codes: out,
                parameter: this.CONFIG.options.parameter,
                index: this.CONFIG.options.order
            };
        }

        return out;
    };

    SELECTOR.prototype.get_selected_coding_system = function () {
        log.info('SELECTOR.get_selected_coding_system; coding_system:', $('input[name="coding_systems' + this.CONFIG.suffix + '"]:checked').val())
        return $('input[name="coding_systems' + this.CONFIG.suffix + '"]:checked').val();
    };

    SELECTOR.prototype.dispose = function () {
        this.CONFIG.tree.off();
        $('.summary-item').off();
        $('#search_' + this.CONFIG.suffix).off();
        $('#clear_all_button_' + this.CONFIG.suffix).off();
        $('#select_all_button_' + this.CONFIG.suffix).off();
    };

    return SELECTOR;

});