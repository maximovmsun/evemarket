﻿$(document).ready(function () {
    function moneyFormat(val, thSep, dcSep) {
        return numberFormat(val.toFixed(2), thSep, dcSep);
    }

    function numberFormat(val, thSep, dcSep) {
        // Проверка указания разделителя разрядов
        if (!thSep) thSep = ' ';

        // Проверка указания десятичного разделителя
        if (!dcSep) dcSep = '.';

        var res = val.toString();
        var lZero = (val < 0); // Признак отрицательного числа

        // Определение длины форматируемой части
        var fLen = res.lastIndexOf('.'); // До десятичной точки
        fLen = (fLen > -1) ? fLen : res.length;

        // Выделение временного буфера
        var tmpRes = res.substring(fLen);
        var cnt = -1;
        for (var ind = fLen; ind > 0; ind--) {
            // Формируем временный буфер
            cnt++;
            if (((cnt % 3) === 0) && (ind !== fLen) && (!lZero || (ind > 1))) {
                tmpRes = thSep + tmpRes;
            }
            tmpRes = res.charAt(ind - 1) + tmpRes;
        }

        return tmpRes.replace('.', dcSep);
    }

    function buildMarketCatalogHtml(marketGroups) {
        var result = '';

        if (marketGroups) {
            for (var i = 0; i < marketGroups.length; i++) {
                var marketGroup = marketGroups[i];
                var groupName = marketGroup[0];
                var subGroups = marketGroup[1];
                var types = marketGroup[2];
                result += '<div class="' + (types == null ? '' : 'market-group-has-types ') + 'market-group market-group-collapsed"><div class="market-group-header"><span class="market-group-header-arrow"></span><span class="market-group-header-text">' + groupName + '</span></div><div class="market-group-content">' + buildMarketCatalogHtml(subGroups) + buildMarketTypesHtml(types) + '</div></div>';
            }
        }

        return result;
    }

    function buildMarketTypesHtml(marketTypes) {
        var result = '';

        if (marketTypes) {
            for (var i = 0; i < marketTypes.length; i++) {
                var marketType = marketTypes[i];
                var typeId = marketType[0];
                var typeName = marketType[1];
                result += '<div class="market-type"><span class="market-type-text" data-type="' + typeId + '">' + typeName + '</span></div>';
            }
        }

        return result;
    }
    
    function getMarketStat(types, systemId) {
        if (typesCache.toString() == types.toString() && systemIdCache == systemId) {
            return;
        }

        typesCache = types;
        systemIdCache = systemId;

        var url = 'https://api.eve-central.com/api/marketstat/json?typeid=' + types.map(function (type) { return type[0]; }).toString();

        if (systemId) {
            url += '&usesystem=' + systemId;
        }

        var timer = null;

        $.ajax({
            dataType: "json",
            cache: true,
            url: url,
            beforeSend: function (data) {
                timer = setTimeout(function () {
                    var MARKETDETAILS = $('#MARKETDETAILS');
                    MARKETDETAILS.html('<img src="Content/wait.gif"></img>');
                }, 500);

            },
            success: function (data) {
                clearTimeout(timer);
                var MARKETDETAILS = $('#MARKETDETAILS');
                MARKETDETAILS.html('');
                for (var i = 0; i < data.length; i++) {
                    var typeStat = data[i];
                    typeStat['typeInfo'] = types.filter(function (type) { return type[0] == typeStat['buy']['forQuery']['types'][0]; })[0];

                    MARKETDETAILS.append(
                        '<div><table><tr><td><img src="https://image.eveonline.com/Type/' + typeStat['typeInfo'][0] + '_64.png" /></td><td>' + typeStat['typeInfo'][1] + '</td></tr></table>'
                        + '<table class="market-stat"><tr><td></td><th>Sell</th><th>Buy</th></tr>'
                        + '<tr><tr><th>Volume</th><td>'
                        + numberFormat(typeStat['sell']['volume']) + '</td><td>' + numberFormat(typeStat['buy']['volume'])
                        + '</td></tr><tr><th>Min</th>'
                        + '<td style="background-color: lightgreen">' + moneyFormat(typeStat['sell']['min']) + '</td><td>' + moneyFormat(typeStat['buy']['min'])
                        + '</td></tr><tr><th>Max</th><td>'
                        + moneyFormat(typeStat['sell']['max']) + '</td><td style="background-color: lightgreen">' + moneyFormat(typeStat['buy']['max'])
                        + '</td></tr><tr><th>Avg</th><td>'
                        + moneyFormat(typeStat['sell']['wavg']) + '</td><td>' + moneyFormat(typeStat['buy']['wavg'])
                        + '</td></tr><tr><th>Median</th><td>'
                        + moneyFormat(typeStat['sell']['median']) + '</td><td>' + moneyFormat(typeStat['buy']['median'])
                        + '</td></tr><tr><th>5%</th><td>'
                        + moneyFormat(typeStat['sell']['fivePercent']) + '</td>' + '<td>' + moneyFormat(typeStat['buy']['fivePercent'])
                        + '</td></tr></tr></table></div><br><br>');
                }
            }

        });
    }

    var typesCache = [];
    var systemIdCache = null;
    var searchHistory = [];

    var MARKETCATALOG = $("#MARKETCATALOG");
    MARKETCATALOG.html(buildMarketCatalogHtml(marketCatalog));

    $("#LEFTPANELTABS").tabs();

    var typesSource = marketTypes.map(function (type) { return { value: type[1], label: type[1], id: type[0] } });
    $("#TYPES").autocomplete({
        source: function (request, response) {
            var matcher = new RegExp(($('input[name="SEARCHTYPE"]:checked').val() == 'StartWith' ? '^' : '') + $.ui.autocomplete.escapeRegex(request.term), "i");
            response($.grep(typesSource, function (item) {
                return matcher.test(item.value);
            }));
        },
        minLength: 3,
        select: function (event, ui) {
            var types = [[ui.item.id, ui.item.value]];
            var systemId = $('#SYSTEM').val();

            getMarketStat(types, systemId);

            searchHistory.unshift({ typeId: ui.item.id, typeName: ui.item.value, systemId: systemId });

            if (searchHistory.length > 20) {
                searchHistory.pop();
            }

            buildSearchHistory();
        },
        response: function (event, ui) {
            if (ui.content.length > 20) {
                ui.content.splice(20);// = ui.content.slice(0, 20);
            }
        }
    })
    .autocomplete('instance')._renderItem = function (ul, item) {
        return $('<li>')
          .append('<img  style="vertical-align: middle;" src="https://image.eveonline.com/Type/' + item.id.toString() + '_32.png"></img> ' + item.value)
          .appendTo(ul);
    };

    function buildSearchHistory() {
        var SEARCHHISTORY = $('#SEARCHHISTORY');
        SEARCHHISTORY.html('');

        searchHistory.forEach(function (value) { SEARCHHISTORY.append('<tr class="search-history-item" data-type="' + value.typeId + '"><td style="width: 35px;"><img src="https://image.eveonline.com/Type/' + value.typeId + '_32.png" /></td><td>' + value.typeName + '</td></tr>'); });

        $('.search-history-item', SEARCHHISTORY).click(function () {
            var typeId = this.getAttribute('data-type');
            var name = marketTypes.filter(function (item) { return item[0] == typeId })[0][1];
            var types = [[typeId, name]];

            var systemId = $('#SYSTEM').val();

            getMarketStat(types, systemId);
        });
    }

    //$('#CLEARHISTORY')
    //    .button()
    //    .click(function (event) {
    //        searchHistory = [];

    //        buildSearchHistory();
    //    });



    $(".market-group-header-arrow, .market-group-header-text:not(.market-group-has-types)").click(function () {
        var marketGroup = $(this).parent().parent();

        if (marketGroup.hasClass('market-group-collapsed')) {
            marketGroup.removeClass('market-group-collapsed');
        }
        else {
            marketGroup.addClass('market-group-collapsed');
        }
    });

    $(".market-group-has-types .market-group-header-text").click(function () {
        var marketGroup = $(this).parent().parent();

        if (marketGroup.hasClass('market-group-collapsed')) {
            marketGroup.removeClass('market-group-collapsed');
        }
    });

    $(".market-type-text").click(function () {
        var typeId = parseInt(this.getAttribute('data-type'));

        var name = marketTypes.filter(function (item) { return item[0] == typeId })[0][1]; //this.innerHTML;
        var types = [[typeId, name]];
        var systemId = $('#SYSTEM').val();

        getMarketStat(types, systemId);
    });

    $(".market-group-has-types .market-group-header-text").click(function () {
        var types = $(".market-type-text", $(this).parent().parent()).toArray().map(function (span) {
            var typeId = parseInt(span.getAttribute('data-type'));
            var name = marketTypes.filter(function (item) { return item[0] == typeId })[0][1];
            return [typeId, name]
        });
        var systemId = $('#SYSTEM').val();

        getMarketStat(types, systemId);
    });

    $('#SYSTEM').change(function () {
        if (typesCache.length > 0) {
            var systemId = this.value;

            getMarketStat(typesCache, systemId);
        }
    });
});
