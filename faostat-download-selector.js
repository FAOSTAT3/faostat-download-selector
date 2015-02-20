define(['jquery',
        'handlebars',
        'text!faostat_download_selector/html/templates.html',
        'i18n!faostat_download_selector/nls/translate',
        'bootstrap',
        'jstree',
        'sweet-alert'], function ($, Handlebars, templates, translate) {

    'use strict';

    function SELECTOR() {

        this.CONFIG = {
            lang: 'E',
            placeholder_id: 'placeholder',
            suffix: 'area',
            tabs :   [
                {
                    label: 'Test',
                    rest: 'http://faostat3.fao.org/wds/rest/procedures/usp_GetListBox/faostatdb/GT/1/1/E'
                }
            ]
        };

    }

    SELECTOR.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Fix the language, if needed. */
        this.CONFIG.lang = this.CONFIG.lang != null ? this.CONFIG.lang : 'E';

        /* this... */
        var _this = this;

        /* Load main structure. */
        var source = $(templates).filter('#main_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            tab_headers_id: 'tab_headers_' + this.CONFIG.suffix,
            tab_contents_id: 'tab_contents_' + this.CONFIG.suffix,
            go_to_label: translate.go_to,
            clear_all_label: translate.clear_all,
            select_all_label: translate.select_all,
            select_all_button_id: 'select_all_button_' + this.CONFIG.suffix,
            clear_all_button_id: 'clear_all_button_' + this.CONFIG.suffix,
            search_id: 'search_' + this.CONFIG.suffix
        };
        var html = template(dynamic_data);
        $('#' + this.CONFIG.placeholder_id).html(html);

        /* Add tab headers and contents. */
        for (var tab_idx = 0 ; tab_idx < this.CONFIG.tabs.length ; tab_idx++) {
            this.add_tab_header(tab_idx, this.CONFIG.tabs[tab_idx].label);
            this.add_tab_content(tab_idx);
            this.load_codelist(tab_idx, this.CONFIG.tabs[tab_idx].rest)
            this.bind_search(tab_idx);
        }

        /* Bind select all functions. */
        $('#select_all_button_' + this.CONFIG.suffix).click(function() {
            _this.select_all();
        });

        /* Bind clear all functions. */
        $('#clear_all_button_' + this.CONFIG.suffix).click(function() {
            _this.clear_all();
        });

        /* Show the first tab. */
        $($('#tab_headers_' + this.CONFIG.suffix).find('a')[0]).tab('show');

    };

    SELECTOR.prototype.add_tab_header = function(tab_idx, tab_header_label) {
        var source = $(templates).filter('#tab_header_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            role_id: 'role_' + this.CONFIG.suffix + '_' + tab_idx,
            tab_header_label: tab_header_label
        };
        var html = template(dynamic_data);
        $('#tab_headers_' + this.CONFIG.suffix).append(html);
    };

    SELECTOR.prototype.add_tab_content = function(tab_idx) {
        var source = $(templates).filter('#tab_content_structure').html();
        var template = Handlebars.compile(source);
        var dynamic_data = {
            id: 'role_' + this.CONFIG.suffix + '_' + tab_idx,
            content_id: 'content_' + this.CONFIG.suffix + '_' + tab_idx
        };
        var html = template(dynamic_data);
        $('#tab_contents_' + this.CONFIG.suffix).append(html);
    };

    SELECTOR.prototype.load_codelist = function(tab_idx, rest) {

        var _this = this;

        $.ajax({

            type: 'GET',
            url: rest,

            success: function (response) {

                /* Cast the response to JSON, if needed. */
                var json = response;
                if (typeof json == 'string')
                    json = $.parseJSON(response);

                /* Cast array to objects */
                var payload = [];
                for (var i = 0 ; i < json.length ; i++)
                    payload.push({
                        id: json[i][0],
                        text: json[i][1],
                        type: json[i][3]
                    });

                /* Init JSTree. */
                $('#content_' + _this.CONFIG.suffix + '_' + tab_idx).jstree({

                    'plugins': ['unique', 'search', 'types', 'wholerow'],

                    'core': {
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

            }

        });

    };

    SELECTOR.prototype.bind_search = function(tab_idx) {
        var to = false;
        var _this = this;
        $('#search_' + this.CONFIG.suffix).keyup(function() {
            if (to)
                clearTimeout(to);
            to = setTimeout(function() {
                var v = $('#search_' + _this.CONFIG.suffix).val();
                $('#content_' + _this.CONFIG.suffix + '_' + tab_idx).jstree(true).search(v);
            }, 250);
        });
    };

    SELECTOR.prototype.active_tab_idx = function() {
        var tab_idx = $('ul#tab_headers_' + this.CONFIG.suffix + ' li.active').attr('role');
        return tab_idx.charAt(tab_idx.length - 1);
    };

    SELECTOR.prototype.select_all = function() {
        var tab_idx = this.active_tab_idx();
        $('#content_' + this.CONFIG.suffix + '_' + tab_idx + ' ul li div').addClass('jstree-wholerow-clicked')
    };

    SELECTOR.prototype.clear_all = function() {
        var tab_idx = this.active_tab_idx();
        $('#content_' + this.CONFIG.suffix + '_' + tab_idx + ' ul li div').removeClass('jstree-wholerow-clicked')
    };

    return SELECTOR;

});