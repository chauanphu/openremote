import { css, html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { AssetWidgetSettings } from "../util/or-asset-widget";
import { StreetlightWidgetConfig } from "../widgets/streetlight-widget";
import { AssetTypeSelectEvent, AssetTypesFilterConfig, AttributeNamesSelectEvent } from "../panels/assettypes-panel";

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
                enabled: false
            },
            attributes: {
                enabled: true,
                multi: true
            }
        } as AssetTypesFilterConfig;
        
        return html`
            <div>
                <!-- Asset type and attributes picker -->
                <settings-panel displayName="attributes" expanded="${true}">
                    <div style="padding-bottom: 12px;">
                        <assettypes-panel .assetType="${this.widgetConfig.assetType}" .config="${config}"
                                          .attributeNames="${this.widgetConfig.attributeNames}"
                                          @assettype-select="${(ev: AssetTypeSelectEvent) => this.onAssetTypeSelect(ev)}"
                                          @attributenames-select="${(ev: AttributeNamesSelectEvent) => this.onAttributesSelect(ev)}"
                        ></assettypes-panel>
                    </div>
                </settings-panel>
            </div>
        `
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
}
