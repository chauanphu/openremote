import { AssetDatapointIntervalQuery, AssetDatapointQueryUnion, Asset, AttributeRef, Attribute } from "@openremote/model";
import { html, PropertyValues, TemplateResult } from "lit";
import { when } from "lit/directives/when.js";
import moment from "moment";
import { OrAssetWidget } from "../util/or-asset-widget";
import { customElement, state } from "lit/decorators.js";
import { AssetWidgetConfig } from "../util/widget-config";
import { OrWidget, WidgetManifest } from "../util/or-widget";
import { AssetSpecificBarChartSettings } from "../settings/asset-specific-barchart-settings";
import { WidgetSettings } from "../util/widget-settings";
import "@openremote/or-attribute-barchart";
import { BarChartAttributeConfig, BarChartInterval, OrAttributeBarChart } from "@openremote/or-attribute-barchart";

export interface AssetSpecificBarChartWidgetConfig extends AssetWidgetConfig {
    assetType?: string;
    attributeNames: string[];
    attributeColors: [AttributeRef, string][];
    attributeSettings: BarChartAttributeConfig;
    datapointQuery: AssetDatapointQueryUnion;
    chartOptions?: any;
    showTimestampControls: boolean;
    defaultTimeWindowKey: string;
    defaultTimePrefixKey: string;
    defaultInterval: BarChartInterval;
    showLegend: boolean;
    stacked: boolean;
    decimals: number;
}

function getDefaultWidgetConfig(): AssetSpecificBarChartWidgetConfig {
    const preset = "Day";
    const dateFunc = OrAttributeBarChart.getDefaultTimeWindowOptions().get(preset);
    const startDate = moment().subtract(dateFunc![1], dateFunc![0]).startOf(dateFunc![0]);
    const endDate = dateFunc![1] === 1 ? moment().endOf(dateFunc![0]) : moment();
    return {
        attributeRefs: [],
        assetType: undefined,
        attributeNames: [],
        attributeColors: [],
        attributeSettings: {},
        datapointQuery: {
            type: "interval",
            fromTimestamp: startDate.toDate().getTime(),
            toTimestamp: endDate.toDate().getTime()
        },
        chartOptions: {
            options: {
                scales: {
                    y: {
                        min: undefined,
                        max: undefined
                    },
                    y1: {
                        min: undefined,
                        max: undefined
                    }
                }
            }
        },
        showTimestampControls: false,
        defaultTimeWindowKey: preset,
        defaultTimePrefixKey: "this",
        defaultInterval: BarChartInterval.AUTO,
        showLegend: true,
        stacked: false,
        decimals: 2
    };
}

@customElement("asset-barchart-widget")
export class AssetSpecificBarChartWidget extends OrAssetWidget {

    @state()
    protected datapointQuery!: AssetDatapointQueryUnion;

    @state()
    protected _loading = false;

    @state()
    protected _activeAssetId?: string;

    protected widgetConfig!: AssetSpecificBarChartWidgetConfig;

    static getManifest(): WidgetManifest {
        return {
            displayName: "Asset Bar Chart",
            displayIcon: "chart-bar",
            minColumnWidth: 2,
            minColumnHeight: 2,
            getContentHtml(config: AssetSpecificBarChartWidgetConfig): OrWidget {
                return new AssetSpecificBarChartWidget(config);
            },
            getSettingsHtml(config: AssetSpecificBarChartWidgetConfig): WidgetSettings {
                const settings = new AssetSpecificBarChartSettings(config);
                settings.setTimeWindowOptions(OrAttributeBarChart.getDefaultTimeWindowOptions());
                settings.setTimePrefixOptions(OrAttributeBarChart.getDefaultTimePrefixOptions());
                settings.setIntervalOptions(OrAttributeBarChart.getDefaultIntervalOptions());
                return settings;
            },
            getDefaultConfig(): AssetSpecificBarChartWidgetConfig {
                return getDefaultWidgetConfig();
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('or-dash-asset-selected', this._handleAssetSelected as EventListener);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('or-dash-asset-selected', this._handleAssetSelected as EventListener);
    }

    protected _handleAssetSelected = (e: CustomEvent<{ assetId: string }>) => {
        if (e.detail && e.detail.assetId) {
            this._activeAssetId = e.detail.assetId;
            this._loadActiveAsset();
        }
    }

    public refreshContent(force: boolean) {
        if (!force) {
            const datapointQuery = structuredClone(this.widgetConfig.datapointQuery);
            datapointQuery.fromTimestamp = undefined;
            datapointQuery.toTimestamp = undefined;
            this.datapointQuery = datapointQuery;
        } else {
            this.widgetConfig = structuredClone(this.widgetConfig);
            this._loadActiveAsset();
        }
    }

    protected willUpdate(changedProps: PropertyValues) {
        if (!this.widgetConfig.datapointQuery) {
            this.widgetConfig.datapointQuery = this.getDefaultQuery();
            if (!changedProps.has("widgetConfig")) {
                changedProps.set("widgetConfig", this.widgetConfig);
            }
        }

        if (changedProps.has("widgetConfig") && this.widgetConfig) {
            this.datapointQuery = this.widgetConfig.datapointQuery;
            if (this._activeAssetId) {
                this._loadActiveAsset();
            }
        }

        return super.willUpdate(changedProps);
    }

    protected _loadActiveAsset() {
        if (!this._activeAssetId || this.widgetConfig.attributeNames.length === 0) {
            this.loadedAssets = [];
            this.assetAttributes = [];
            return;
        }

        this._loading = true;
        this._error = undefined;

        this.fetchActiveAssets([this._activeAssetId], this.widgetConfig.attributeNames).then(assets => {
            this.loadedAssets = assets;

            this.assetAttributes = [];
            if (assets && assets.length > 0) {
                const asset = assets[0];
                if (this.widgetConfig.assetType && asset.type !== this.widgetConfig.assetType) {
                    this._error = "Selected asset does not match the configured asset type.";
                    return;
                }

                this.widgetConfig.attributeNames.forEach(attrName => {
                    const attribute = asset.attributes ? asset.attributes[attrName] : undefined;
                    if (attribute) {
                        this.assetAttributes.push([0, attribute]);
                    }
                });
            }
        }).catch(e => {
            this._error = e.message;
        }).finally(() => {
            this._loading = false;
        });
    }

    protected async fetchActiveAssets(assetIds: string[], attributeNames: string[]): Promise<Asset[]> {
        return this.queryAssets({
            ids: assetIds,
            select: {
                attributes: attributeNames
            }
        });
    }

    protected render(): TemplateResult {
        if (!this._activeAssetId) {
            return html`
                <div style="height: 100%; display: flex; justify-content: center; align-items: center; text-align: center;">
                    <span style="color: var(--mdc-theme-text-secondary-on-background, rgba(0,0,0,0.54)); font-style: italic; padding: 16px;">
                        Select an asset on the map or control panel to view its energy chart.
                    </span>
                </div>
            `;
        }

        return html`
            ${when(this._loading, () => html`
                <or-loading-indicator></or-loading-indicator>
            `, () => when(this._error, () => html`
                <div style="height: 100%; display: flex; justify-content: center; align-items: center; text-align: center;">
                    <span><or-translate .value="${this._error}"></or-translate></span>
                </div>
            `, () => {
            if (this.loadedAssets.length === 0 || this.assetAttributes.length === 0) {
                return html`
                         <div style="height: 100%; display: flex; justify-content: center; align-items: center; text-align: center;">
                             <span style="color: var(--mdc-theme-text-secondary-on-background, rgba(0,0,0,0.54)); font-style: italic;">
                                 No data available for the selected asset attributes.
                             </span>
                         </div>
                     `;
            }

            let attributeColors: [AttributeRef, string][] = [];
            if (this.loadedAssets[0]) {
                const asset = this.loadedAssets[0];
                this.widgetConfig.attributeNames.forEach((name, idx) => {
                    attributeColors.push([{ id: asset.id, name: name }, OrAttributeBarChart.DEFAULT_COLORS[idx % OrAttributeBarChart.DEFAULT_COLORS.length] || "#000000"]);
                });
            }

            let attributeSettings: BarChartAttributeConfig = this.widgetConfig?.attributeSettings ? structuredClone(this.widgetConfig.attributeSettings) : {};
            if (!attributeSettings.methodAvgAttributes) attributeSettings.methodAvgAttributes = [];
            attributeColors.forEach(c => {
                attributeSettings.methodAvgAttributes!.push(c[0]);
            });

            return html`
                    <or-attribute-barchart .assets="${this.loadedAssets}" .assetAttributes="${this.assetAttributes}"
                                           .attributeColors="${attributeColors}" .attributeConfig="${attributeSettings}"
                                           ?showLegend=${this.widgetConfig?.showLegend} ?stacked=${this.widgetConfig?.stacked}
                                           .timestampControls="${!this.widgetConfig?.showTimestampControls}"
                                           .interval="${this.widgetConfig?.defaultInterval}"
                                           .timePrefixKey="${this.widgetConfig?.defaultTimePrefixKey}"
                                           .timeWindowKey="${this.widgetConfig?.defaultTimeWindowKey}"
                                           .datapointQuery="${this.datapointQuery}" .chartOptions="${this.widgetConfig?.chartOptions}"
                                           .decimals="${this.widgetConfig?.decimals}"
                                           style="height: 100%"
                    ></or-attribute-barchart>
                `;
        }))}
        `;
    }

    protected getDefaultQuery(): AssetDatapointIntervalQuery {
        return {
            type: "interval",
            fromTimestamp: moment().subtract(30, "days").toDate().getTime(),
            toTimestamp: moment().toDate().getTime()
        };
    }
}
