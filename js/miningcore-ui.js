// config
var API = 'http://doge.solopool.us'; // API address
var defaultPool = 'dogecoin'; // Default Pool ID

var currentPool = defaultPool;

// private function
function _formatter(value, decimal, unit) {
    if (value === 0) {
        return '0 ' + unit;
    } else {
        var si = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" },
            { value: 1e21, symbol: "Z" },
            { value: 1e24, symbol: "Y" },
        ];
        for (var i = si.length - 1; i > 0; i--) {
            if (value >= si[i].value) {
                break;
            }
        }
        return (value / si[i].value).toFixed(decimal).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + ' ' + si[i].symbol + unit;
    }
}

function loadPools(renderCallback) {
    $('#currentPool b').remove();
    $('#currentPool ul').remove();
    return $.ajax(API + 'pools')
        .done(function (data) {
            var poolList = '<ul class="dropdown-menu">';
            if (data.pools.length > 1) {
                $('#currentPool').attr('data-toggle', 'dropdown');
                $('#currentPool').append('<b class="caret"></b>');
            }
            $.each(data.pools, function (index, value) {
                if (currentPool.length === 0 && index === 0) {
                    currentPool = value.id;
                }
                if (currentPool === value.id) {
                    $('#currentPool p').attr('data-id', value.id);
                    $('#currentPool p').text(value.coin.type);
                } else {
                    poolList += '<li><a href="javascript:void(0)" data-id="' + value.id + '">' + value.coin.type + '</a></li>';
                }
            });
            poolList += '</ul>';
            if (poolList.length > 0) {
                $('#poolList').append(poolList);
            }
            if (data.pools.length > 1) {
                $('#poolList li a').on('click', function (event) {
                    currentPool = $(event.target).attr('data-id');
                    loadPools(renderCallback);
                });
            }
            if (renderCallback.has()) {
                renderCallback.fire();
            }
        })
        .fail(function () {
            UIkit.notification({
                message: "Error: No response from API.<br>(loadPools)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadStatsData() {
    return $.ajax(API + 'pools')
        .done(function (data) {
            $.each(data.pools, function(index, value) {
		if (currentPool === value.id) {
		var PoolisOfPercent = ((value.poolStats.poolHashrate / value.networkStats.networkHashrate) * 100);    	
		var roundEffort = (value.poolEffort * 100).toFixed(2);
		$("#coinName").text(value.coin.name);
		$("#coinAlgo").text(value.coin.algorithm);
		$("#blockchainHeight").text(value.networkStats.blockHeight);
		$("#connectedPeers").text(value.networkStats.connectedPeers);
		$("#minimumPayment").text(value.paymentProcessing.minimumPayment + " " + value.coin.type);
		$("#payoutScheme").text(value.paymentProcessing.payoutScheme);
		$("#rewardType").text(value.networkStats.rewardType);
		$("#poolFeePercent").text(value.poolFeePercent + " %");
		$("#poolHashRate").text(_formatter(value.poolStats.poolHashrate, 5, "H/s"));
		$("#poolMiners").text(value.poolStats.connectedMiners + " Miner(s)");
		$("#poolWorkers").text(value.poolStats.connectedWorkers + " Worker(s)");
		$("#networkHashRate").text(_formatter(value.networkStats.networkHashrate, 3, "H/s"));
		$("#networkDifficulty").text(_formatter(value.networkStats.networkDifficulty, 3, "H/s"));
		$("#lastNetworkBlock").text(dateConvertor(value.networkStats.lastNetworkBlockTime));
		$("#blockConfirmations").text(value.paymentProcessing.minimumConfirmations);
		$("#poolPercentofNetwork").text(PoolisOfPercent.toFixed(3) + " %");
		$("#poolEstimatedBlocks").text((PoolisOfPercent * 720 / 100).toFixed(4));
		$("#totalPaid").text(_formatter(value.totalPaid, 2,""));
		$("#sharesPerSecond").text(_formatter(value.poolStats.sharesPerSecond, 5, 'H/s'));
		$("#poolBlocks").text(value.totalBlocks);
		$("#lastPoolBlock").text(dateConvertor(value.lastPoolBlockTime));
		$("#poolEffort").text(roundEffort + "%");
                }
            });
        })
        .fail(function () {
             UIkit.notification({
                message: "Error: No response from API.<br>(loadStatsData)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadStatsChart() {
    return $.ajax(API + 'pools/' + currentPool + '/performance')
        .done(function (data) {
            labels = [];
            connectedMiners = [];
            networkHashRate = [];
            poolHashRate = [];
            $.each(data.stats, function (index, value) {
                if (labels.length === 0 || (labels.length + 1) % 4 === 1) {
                    labels.push(new Date(value.created).toISOString().slice(11, 16));
                } else {
                    labels.push('');
                }
                networkHashRate.push(value.networkHashrate);
                poolHashRate.push(value.poolHashrate);
                connectedMiners.push(value.connectedMiners);
            });
            var data = {
                labels: labels,
                series: [
                    networkHashRate,
                    poolHashRate,
                ],
            };
            var options = {
                showArea: true,
                height: "245px",
                axisX: {
                    showGrid: false,
                },
                axisY: {
                    offset: 47,
                    labelInterpolationFnc: function(value) {
                        return _formatter(value, 1, '');
                    }
                },
                lineSmooth: Chartist.Interpolation.simple({
                    divisor: 2,
                }),
            };
            var responsiveOptions = [
                ['screen and (max-width: 640px)', {
                    axisX: {
                        labelInterpolationFnc: function (value) {
                            return value[0];
                        }
                    },
                }],
            ];
            Chartist.Line('#chartStatsHashRate', data, options, responsiveOptions);
            var data = {
                labels: labels,
                series: [
                    connectedMiners,
                ],
            };
            var options = {
                height: "245px",
                axisX: {
                    showGrid: false,
                },
                lineSmooth: Chartist.Interpolation.simple({
                    divisor: 2,
                }),
            };
            var responsiveOptions = [
                ['screen and (max-width: 640px)', {
                    axisX: {
                        labelInterpolationFnc: function (value) {
                            return value[0];
                        }
                    },
                }],
            ];
            Chartist.Line('#chartStatsMiners', data, options, responsiveOptions);
        })
        .fail(function () {
             UIkit.notification({
                message: "Error: No response from API.<br>(loadStatsChart)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadDashboardData(walletAddress) {
    return $.ajax(API + 'pools/' + currentPool + '/miners/' + walletAddress)
        .done(function (data) {
            $('#pendingShares').text(_formatter(data.pendingShares, 0, ''));
            var workerHashRate = 0;
            $.each(data.performanceSamples.workers, function (index, value) {
                workerHashRate += value.hashrate;
            });
            $('#minerHashRate').text(_formatter(workerHashRate, 5, 'Sol/s'));
            $('#pendingBalance').text(_formatter(data.pendingBalance, 5, 'EXCC'));
            $('#paidBalance').text(_formatter(data.totalPaid, 5, 'EXCC'));
            $('#lifetimeBalance').text(_formatter(data.pendingBalance + data.totalPaid, 5, ''));
        })
        .fail(function () {
             UIkit.notification({
                message: "Error: No response from API.<br>(loadDashboardData)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadDashboardWorkerList(walletAddress) {
    return $.ajax(API + 'pools/' + currentPool + '/miners/' + walletAddress + '/performance')
        .done(function (data) {
            var workerList = '<thead><th>Name</th><th>Hash Rate</th><th>Share Rate</th></thead><tbody>';
            if (data.length > 0) {
                $.each(data[data.length-1].workers, function (index, value) {
                    workerList += '<tr>';
                    if (index.length === 0) {
                        workerList += '<td>Unnamed</td>';
                    } else {
                        workerList += '<td>' + index + '</td>';
                    }
                    workerList += '<td>' + _formatter(value.hashrate, 5, 'Sol/s') + '</td>';
                    workerList += '<td>' + _formatter(value.sharesPerSecond, 5, 'S/s') + '</td>';
                    workerList += '</tr>';
                });
            } else {
                workerList += '<tr><td colspan="3">None</td></tr>';
            }
            workerList += '</tbody>';
            $('#workerList').html(workerList);
        })
        .fail(function () {
             UIkit.notification({
                message: "Error: No response from API.<br>(loadDashboardWorkerList)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadDashboardChart(walletAddress) {
    return $.ajax(API + 'pools/' + currentPool + '/miners/' + walletAddress + '/performance')
        .done(function (data) {
            if (data.length > 0) {
                labels = [];
                minerHashRate = [];
                $.each(data, function (index, value) {
                    if (labels.length === 0 || (labels.length + 1) % 4 === 1) {
                        labels.push(new Date(value.created).toISOString().slice(11, 16));
                    } else {
                        labels.push('');
                    }
                    var workerHashRate = 0;
                    $.each(value.workers, function (index2, value2) {
                        workerHashRate += value2.hashrate;
                    });
                    minerHashRate.push(workerHashRate);
                });
                var data = {
                    labels: labels,
                    series: [
                        minerHashRate,
                    ],
                };
                var options = {
                    showArea: true,
                    height: "245px",
                    axisX: {
                        showGrid: false,
                    },
                    axisY: {
                        offset: 47,
                        labelInterpolationFnc: function(value) {
                            return _formatter(value, 1, '');
                        }
                    },
                    lineSmooth: Chartist.Interpolation.simple({
                        divisor: 2,
                    }),
                };
                var responsiveOptions = [
                    ['screen and (max-width: 640px)', {
                        axisX: {
                            labelInterpolationFnc: function (value) {
                                return value[0];
                            }
                        },
                    }],
                ];
                Chartist.Line('#chartDashboardHashRate', data, options, responsiveOptions);
            }
        })
        .fail(function () {
             UIkit.notification({
                message: "Error: No response from API.<br>(loadDashboardChart)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadMinersList() {
    return $.ajax(API + 'pools/' + currentPool + '/miners')
        .done(function (data) {
            var minerList = '<thead><tr><th>Address</th><th>Hash Rate</th><th>Share Rate</th></tr></thead><tbody>';
            if (data.length > 0) {
                $.each(data, function (index, value) {
                    minerList += '<tr>';
                    minerList += '<td>' + value.miner.substring(0, 12) + ' &hellip; ' + value.miner.substring(value.miner.length - 12) + '</td>';
                    //minerList += '<td><a href="' + value.minerAddressInfoLink + '" target="_blank">' + value.miner.substring(0, 12) + ' &hellip; ' + value.miner.substring(value.miner.length - 12) + '</td>';
                    minerList += '<td>' + _formatter(value.hashrate, 5, 'Sol/s') + '</td>';
                    minerList += '<td>' + _formatter(value.sharesPerSecond, 5, 'S/s') + '</td>';
                    minerList += '</tr>';
                });
            } else {
                minerList += '<tr><td colspan="3">None</td></tr>';
            }
            minerList += '</tbody>';
            $('#minerList').html(minerList);
        })
        .fail(function () {
            UIkit.notification({
                message: "Error: No response from API.<br>(loadMinersList)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadBlocksList(pageSize) {
    return $.ajax(API + 'pools/' + currentPool + '/blocks?pageSize=' + pageSize)
        .done(function (data) {
            var blockList = '<thead><tr><th>Date &amp; Time</th><th>Height</th><th>Effort</th><th>Status</th><th>Reward</th><th>Confirmation</th><th>Block Explorer</th></tr></thead><tbody>';
            if (data.length > 0) {
                $.each(data, function (index, value) {
                    blockList += '<tr>';
                    blockList += '<td>' + new Date(value.created).toLocaleString() + '</td>';
                    blockList += '<td>' + value.blockHeight + '</td>';
                    if (typeof(value.effort) !== "undefined") {
                        blockList += '<td>~' + Math.round(value.effort * 100) + '%</td>';
                    } else {
                        blockList += '<td>n/a</td>';
                    }
                    blockList += '<td>' + value.status + '</td>';
                    blockList += '<td>' + _formatter(value.reward, 5, '') + '</td>';
                    blockList += '<td>~' + Math.round(value.confirmationProgress * 100) + '%</td>';
                    blockList += '<td><a href="' + value.infoLink + '" target="_blank">' + value.transactionConfirmationData.substring(0, 16) + ' &hellip; ' + value.transactionConfirmationData.substring(value.transactionConfirmationData.length - 16) + ' </a></td>';
                    blockList += '</tr>'
                });
            } else {
                blockList += '<tr><td colspan="5">None</td></tr>';
            }
            blockList += '</tbody>';
            $('#blockList').html(blockList);
        })
        .fail(function () {
            UIkit.notification({
                message: "Error: No response from API.<br>(loadBlocksList)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadPaymentsList() {
    return $.ajax(API + 'pools/' + currentPool + '/payments?pageSize=500')
        .done(function (data) {
            var paymentList = '<thead><tr><th>Date &amp; Time</th><th>Address</th><th>Amount</th><th>Confirmation</th></tr></thead><tbody>';
            if (data.length > 0) {
                $.each(data, function (index, value) {
                    paymentList += '<tr>';
                    paymentList += '<td>' + new Date(value.created).toLocaleString() + '</td>';
                    paymentList += '<td><a href="' + value.addressInfoLink + '" target="_blank">' + value.address.substring(0, 12) + ' &hellip; ' + value.address.substring(value.address.length - 12) + '</td>';
                    paymentList += '<td>' + _formatter(value.amount, 5, '') + '</td>';
                    paymentList += '<td><a href="' + value.transactionInfoLink + '" target="_blank">' + value.transactionConfirmationData.substring(0, 16) + ' &hellip; ' + value.transactionConfirmationData.substring(value.transactionConfirmationData.length - 16) + ' </a></td>';
                    paymentList += '</tr>';
                });
            } else {
                paymentList += '<tr><td colspan="3">None</td></tr>';
            }
            paymentList += '</tbody>';
            $('#paymentList').html(paymentList);
        })
        .fail(function () {
            UIkit.notification({
                message: "Error: No response from API.<br>(loadPaymentsList)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}

function loadConnectConfig() {
    return $.ajax(API + 'pools')
        .done(function (data) {
            var connectPoolConfig = '<thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>';
            $.each(data.pools, function (index, value) {
                if (currentPool === value.id) {
                    connectPoolConfig += '<tr><td>Algorithm</td><td>' + value.coin.algorithm + '</td></tr>';
                    connectPoolConfig += '<tr><td>Wallet Address</td><td><a href="' + value.addressInfoLink + '" target="_blank">' + value.address.substring(0, 12) + ' &hellip; ' + value.address.substring(value.address.length - 12) + '</a></td></tr>';
                    connectPoolConfig += '<tr><td>Payout Scheme</td><td>' + value.paymentProcessing.payoutScheme + '</td></tr>';
                    connectPoolConfig += '<tr><td>Minimum Payment w/o #</td><td>' + value.paymentProcessing.minimumPayment + '</td></tr>';
                    if (typeof(value.paymentProcessing.minimumPaymentToPaymentId) !== "undefined") {
                        connectPoolConfig += '<tr><td>Minimum Payment w/ #</td><td>' + value.paymentProcessing.minimumPaymentToPaymentId + '</td></tr>';
                    }
                    connectPoolConfig += '<tr><td>Pool Fee</td><td>' + value.poolFeePercent + '%</td></tr>';
                    $.each(value.ports, function (port, options) {
                        connectPoolConfig += '<tr><td>Port ' + port + ' Difficulty</td><td>';
                        if (typeof(options.varDiff) !== "undefined") {
                            connectPoolConfig += 'Variable / ' + options.varDiff.minDiff + ' &harr; ';
                            if (typeof(options.varDiff.maxDiff) === "undefined") {
                                connectPoolConfig += '&infin;';
                            } else {
                                connectPoolConfig += options.varDiff.maxDiff;
                            }
                        } else {
                            connectPoolConfig += 'Static / ' + options.difficulty;
                        }
                        connectPoolConfig += '</td></tr>';
                    });
                }
            });
            connectPoolConfig += '</tbody>';
            $('#connectPoolConfig').html(connectPoolConfig);
        })
        .fail(function () {
             UIkit.notification({
                message: "Error: No response from API.<br>(loadConnectConfig)",
                timeout: 5000,
                pos: "top-right",
            });
        });
}
