import {css, html, TemplateResult} from "lit";
import {customElement} from "lit/decorators.js";
import {WidgetSettings} from "../util/widget-settings";
import "../util/settings-panel";
import {i18next} from "@openremote/or-translate";
import {InputType, OrInputChangedEvent} from "@openremote/or-mwc-components/or-mwc-input";
import {when} from "lit/directives/when.js";
import moment from "moment/moment";
import {BarChartInterval, IntervalConfig} from "@openremote/or-attribute-barchart";
import {AssetSpecificBarChartWidgetConfig} from "../widgets/asset-specific-barchart-widget";
import {AssetTypeSelectEvent, AssetTypesFilterConfig, AttributeNamesSelectEvent} from "../panels/assettypes-panel";
import "../panels/assettypes-panel";

const styling = css`
    .switch-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
`;

@customElement("asset-barchart-settings")
export class AssetSpecificBarChartSettings extends WidgetSettings {
    protected widgetConfig!: AssetSpecificBarChartWidgetConfig;

    protected timeWindowOptions: Map<string, [moment.unitOfTime.DurationConstructor, number]> = new Map<string, [moment.unitOfTime.DurationConstructor, number]>;
    protected timePrefixOptions: string[] = [];
    protected intervalOptions: Map<BarChartInterval, IntervalConfig> = new Map<BarChartInterval, IntervalConfig>();

    public setTimeWindowOptions(options: Map<string, [moment.unitOfTime.DurationConstructor, number]>) {
        this.timeWindowOptions = options;
    }

    public setTimePrefixOptions(options: string[]) {
        this.timePrefixOptions = options;
    }

    public setIntervalOptions(options: Map<BarChartInterval, IntervalConfig>) {
        this.intervalOptions = options;
    }

    static get styles() {
        return [...super.styles, styling];
    }

    protected render(): TemplateResult {
        const timeWindowOpts = Array.from(this.timeWindowOptions.keys()).map(o => ([o, i18next.t(o.toLowerCase())] as [string, string]));
        const intervalOpts = Array.from(this.intervalOptions.keys()).map(o => ([o, i18next.t(`intervalBy${o.toLowerCase()}`)] as [string, string]));

        const config = {
            assets: {
                enabled: false
            },
            attributes: {
                enabled: true,
                multi: true
            }
        } as AssetTypesFilterConfig;

        return html`
            <div>
                <!-- Asset type and attributes -->
                <settings-panel displayName="attributes" expanded="${true}">
                    <div style="padding-bottom: 12px;">
                        <assettypes-panel .assetType="${this.widgetConfig.assetType}" .config="${config}"
                                          .attributeNames="${this.widgetConfig.attributeNames}"
                                          @assettype-select="${(ev: AssetTypeSelectEvent) => this.onAssetTypeSelect(ev)}"
                                          @attributenames-select="${(ev: AttributeNamesSelectEvent) => this.onAttributesSelect(ev)}"
                        ></assettypes-panel>
                    </div>
                </settings-panel>

                <!-- Time options -->
                <settings-panel displayName="time" expanded="${true}">
                    <div style="padding-bottom: 12px; display: flex; flex-direction: column; gap: 6px;">
                        
                        <!-- Timeframe & interval -->
                        <or-mwc-input .type="${InputType.SELECT}" label="${i18next.t("prefixDefault")}" style="width: 100%;"
                                      .options="${this.timePrefixOptions}" value="${this.widgetConfig.defaultTimePrefixKey}"
                                      @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onTimePrefixSelect(ev)}"
                        ></or-mwc-input>
                        <or-mwc-input .type="${InputType.SELECT}" label="${i18next.t("timeframeDefault")}" style="width: 100%;"
                                      .options="${timeWindowOpts}" value="${this.widgetConfig.defaultTimeWindowKey}"
                                      @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onTimeWindowSelect(ev)}"
                        ></or-mwc-input>
                        <or-mwc-input .type="${InputType.SELECT}" label="${i18next.t("withInterval")}" style="width: 100%;"
                                      .options="${intervalOpts}" value="${this.widgetConfig.defaultInterval}"
                                      @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onIntervalSelect(ev)}"
                        ></or-mwc-input>
                    </div>
                </settings-panel>
                
                <!-- Display options -->
                <settings-panel displayName="display" expanded="${false}">
                    <div style="padding-bottom: 12px; display: flex; flex-direction: column; gap: 16px;">
                        <!-- Stacked -->
                        <div class="switch-container">
                            <span><or-translate value="dashboard.toggleStackView"></or-translate></span>
                            <or-mwc-input .type="${InputType.SWITCH}" style="margin: 0 -10px;" .value="${this.widgetConfig.stacked}"
                                          @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onDefaultStackedToggle(ev)}"
                            ></or-mwc-input>
                        </div>
                        <!-- Time range selection -->
                        <div class="switch-container">
                            <span><or-translate value="dashboard.allowTimerangeSelect"></or-translate></span>
                            <or-mwc-input .type="${InputType.SWITCH}" style="margin: 0 -10px;" .value="${!this.widgetConfig.showTimestampControls}"
                                          @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onTimestampControlsToggle(ev)}"
                            ></or-mwc-input>
                        </div>
                        <!-- Show legend -->
                        <div class="switch-container">
                            <span><or-translate value="dashboard.showLegend"></or-translate></span>
                            <or-mwc-input .type="${InputType.SWITCH}" style="margin: 0 -10px;" .value="${this.widgetConfig.showLegend}"
                                          @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onShowLegendToggle(ev)}"
                            ></or-mwc-input>
                        </div>
                        <!-- Decimal places -->
                        <div>
                            <or-mwc-input .type="${InputType.NUMBER}" style="width: 100%;" .value="${this.widgetConfig.decimals}" label="${i18next.t("decimals")}" .min="${0}"
                                          @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onDecimalsChange(ev)}"
                            ></or-mwc-input>
                        </div>
                    </div>
                </settings-panel>
            </div>
        `;
    }

    protected onAssetTypeSelect(ev: AssetTypeSelectEvent) {
        this.widgetConfig.assetType = ev.detail;
        this.widgetConfig.attributeNames = [];
        this.notifyConfigUpdate();
    }

    protected onAttributesSelect(ev: AttributeNamesSelectEvent) {
        this.widgetConfig.attributeNames = ev.detail as string[];
        this.notifyConfigUpdate();
    }

    protected onTimePrefixSelect(ev: OrInputChangedEvent) {
        this.widgetConfig.defaultTimePrefixKey = ev.detail.value.toString();
        this.notifyConfigUpdate();
    }

    protected onTimeWindowSelect(ev: OrInputChangedEvent) {
        this.widgetConfig.defaultTimeWindowKey = ev.detail.value.toString();
        this.notifyConfigUpdate();
    }

    protected onIntervalSelect(ev: OrInputChangedEvent) {
        this.widgetConfig.defaultInterval = ev.detail.value.toString();
        this.notifyConfigUpdate();
    }

    protected onTimestampControlsToggle(ev: OrInputChangedEvent) {
        this.widgetConfig.showTimestampControls = !ev.detail.value;
        this.notifyConfigUpdate();
    }

    protected onShowLegendToggle(ev: OrInputChangedEvent) {
        this.widgetConfig.showLegend = ev.detail.value;
        this.notifyConfigUpdate();
    }

    protected onDefaultStackedToggle(ev: OrInputChangedEvent) {
        this.widgetConfig.stacked = ev.detail.value;
        this.notifyConfigUpdate();
    }

    protected onDecimalsChange(ev: OrInputChangedEvent) {
        this.widgetConfig.decimals = ev.detail.value;
        this.notifyConfigUpdate();
    }
}
