import { css, html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { AssetWidgetSettings } from "../util/or-asset-widget";
import { StreetlightWidgetConfig } from "../widgets/streetlight-widget";
import { InputType, OrInputChangedEvent } from "@openremote/or-mwc-components/or-mwc-input";
import { AssetIdsSelectEvent, AssetTypeSelectEvent, AssetAllOfTypeSwitchEvent, AssetTypesFilterConfig, AttributeNamesSelectEvent } from "../panels/assettypes-panel";
import { i18next } from "@openremote/or-translate";
import { LngLat, LngLatLike } from "@openremote/or-map";

const styling = css`
  .customMwcInputContainer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

@customElement("streetlight-settings")
export class StreetlightSettings extends AssetWidgetSettings {

    protected widgetConfig!: StreetlightWidgetConfig;

    static get styles() {
        return [...super.styles, styling];
    }

    protected render(): TemplateResult {
        const config = {
            assets: {
                enabled: true,
                multi: true,
                allOfTypeOption: true
            },
            attributes: {
                enabled: true,
                multi: true
            }
        } as AssetTypesFilterConfig
        return html`
            <div>
                <!-- Map settings -->
                <settings-panel displayName="configuration.mapSettings" expanded="${true}">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div>
                            <or-mwc-input .type="${InputType.NUMBER}" style="width: 100%;"
                                          .value="${this.widgetConfig.zoom}" label="${i18next.t('dashboard.zoom')}"
                                          @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onZoomUpdate(ev)}"
                            ></or-mwc-input>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <or-mwc-input .type="${InputType.TEXT}" style="width: 100%;"
                                          .value="${this.widgetConfig.center ? (Object.values(this.widgetConfig.center))[0] + ', ' + (Object.values(this.widgetConfig.center))[1] : undefined}"
                                          label="${i18next.t('dashboard.center')}"
                                          @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onCenterUpdate(ev)}"
                            ></or-mwc-input>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span><or-translate value="dashboard.showGeoJson"></or-translate></span>
                            <or-mwc-input .type="${InputType.SWITCH}" style="width: 70px;"
                                          .value="${this.widgetConfig.showGeoJson}"
                                          @or-mwc-input-changed="${(ev: OrInputChangedEvent) => this.onGeoJsonToggle(ev)}"
                            ></or-mwc-input>
                        </div>
                    </div>
                </settings-panel>

                <!-- Asset type, assets, and attribute picker -->
                <settings-panel displayName="attributes" expanded="${true}">
                    <div style="padding-bottom: 12px;">
                        <assettypes-panel .assetType="${this.widgetConfig.assetType}" .config="${config}"
                                          .assetIds="${this.widgetConfig.assetIds}" .attributeNames="${this.widgetConfig.attributeNames}"
                                          .allOfType="${this.widgetConfig.allOfType}"
                                          @assettype-select="${(ev: AssetTypeSelectEvent) => this.onAssetTypeSelect(ev)}"
                                          @alloftype-switch="${(ev: AssetAllOfTypeSwitchEvent) => this.onAssetAllOfTypeSwitch(ev)}"
                                          @assetids-select="${(ev: AssetIdsSelectEvent) => this.onAssetIdsSelect(ev)}"
                                          @attributenames-select="${(ev: AttributeNamesSelectEvent) => this.onAttributesSelect(ev)}"
                        ></assettypes-panel>
                    </div>
                </settings-panel>
            </div>
        `
    }

    protected onZoomUpdate(ev: OrInputChangedEvent) {
        this.widgetConfig.zoom = ev.detail.value;
        this.notifyConfigUpdate();
    }

    protected onCenterUpdate(ev: OrInputChangedEvent) {
        if (ev.detail.value) {
            const lngLatArr = (ev.detail.value as string).split(/[, ]/).filter(v => !!v);
            if (lngLatArr.length === 2) {
                const value = new LngLat(
                    Number.parseFloat(lngLatArr[0]),
                    Number.parseFloat(lngLatArr[1])
                );
                this.widgetConfig.center = value as LngLatLike;
                this.notifyConfigUpdate();
            }
        }
    }

    protected onGeoJsonToggle(ev: OrInputChangedEvent) {
        this.widgetConfig.showGeoJson = ev.detail.value;
        this.notifyConfigUpdate();
    }

    protected onAssetTypeSelect(ev: AssetTypeSelectEvent) {
        this.widgetConfig.assetType = ev.detail;
        this.widgetConfig.assetIds = [];
        this.widgetConfig.attributeNames = [];
        this.notifyConfigUpdate();
    }

    protected onAssetAllOfTypeSwitch(ev: AssetAllOfTypeSwitchEvent) {
        this.widgetConfig.allOfType = ev.detail as boolean;
        this.notifyConfigUpdate();
    }

    protected onAssetIdsSelect(ev: AssetIdsSelectEvent) {
        this.widgetConfig.assetIds = ev.detail as string[];
        this.notifyConfigUpdate();
    }

    protected onAttributesSelect(ev: AttributeNamesSelectEvent) {
        this.widgetConfig.attributeNames = ev.detail as string[];
        this.notifyConfigUpdate();
    }
}
