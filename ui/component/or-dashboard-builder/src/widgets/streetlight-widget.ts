import { css, html, PropertyValues, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { OrAssetWidget } from "../util/or-asset-widget";
import { OrWidget, WidgetManifest } from "../util/or-widget";
import { WidgetSettings } from "../util/widget-settings";
import { AssetWidgetConfig } from "../util/widget-config";
import { Asset } from "@openremote/model";
import { when } from "lit/directives/when.js";
import { StreetlightSettings } from "../settings/streetlight-settings";
import "@openremote/or-attribute-input";

export interface StreetlightWidgetConfig extends AssetWidgetConfig {
    assetType?: string;
    attributeNames: string[];
}

function getDefaultConfig(): StreetlightWidgetConfig {
    return {
        attributeRefs: [],
        assetType: undefined,
        attributeNames: []
    } as StreetlightWidgetConfig;
}

const styling = css`
    #widget-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    #control-panel-wrapper {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background-color: var(--mdc-theme-surface, #ffffff);
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .panel-header {
        font-size: 1.25rem;
        font-weight: 500;
        margin-bottom: 8px;
    }
    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        text-align: center;
        color: var(--mdc-theme-text-secondary-on-background, rgba(0,0,0,0.54));
        font-style: italic;
    }
`;

@customElement("streetlight-widget")
export class StreetlightWidget extends OrAssetWidget {

    protected widgetConfig!: StreetlightWidgetConfig;

    @state()
    protected _activeAssetId?: string;

    @state()
    protected _loading = false;

    static getManifest(): WidgetManifest {
        return {
            displayName: "Bảng điều khiển",
            displayIcon: "lightbulb-outline",
            minColumnWidth: 2,
            minColumnHeight: 3,
            getContentHtml(config: StreetlightWidgetConfig): OrWidget {
                return new StreetlightWidget(config);
            },
            getSettingsHtml(config: StreetlightWidgetConfig): WidgetSettings {
                return new StreetlightSettings(config);
            },
            getDefaultConfig(): StreetlightWidgetConfig {
                return getDefaultConfig();
            }
        };
    }

    static get styles() {
        return [...super.styles, styling];
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

    refreshContent(force: boolean): void {
        this._loadActiveAsset();
    }

    protected updated(changedProps: PropertyValues) {
        if (changedProps.has('widgetConfig') && this.widgetConfig) {
            this._loadActiveAsset();
        }
        super.updated(changedProps);
    }

    protected _loadActiveAsset() {
        if (!this._activeAssetId || !this.widgetConfig.assetType) {
            this.loadedAssets = [];
            return;
        }

        this._loading = true;
        this.queryAssets({
            ids: [this._activeAssetId],
            select: {
                attributes: this.widgetConfig.attributeNames
            }
        }).then((assets) => {
            // Check if returned asset matches the configured assetType
            if (assets.length > 0 && assets[0].type === this.widgetConfig.assetType) {
                this.loadedAssets = assets;
            } else {
                this.loadedAssets = [];
            }
        }).finally(() => {
            this._loading = false;
        });
    }

    protected render(): TemplateResult {
        const focusedAsset = this.loadedAssets.length > 0 ? this.loadedAssets[0] : undefined;

        return html`
            <div id="widget-wrapper">
                <div id="control-panel-wrapper">
                    ${when(this._loading, () => html`<or-loading-indicator></or-loading-indicator>`, () =>
            focusedAsset ? html`
                            <div class="panel-header">${focusedAsset.name || focusedAsset.id}</div>
                            ${this.widgetConfig.attributeNames.map(attrName => {
                const attribute = focusedAsset.attributes ? focusedAsset.attributes[attrName] : undefined;
                if (!attribute) return html``;
                const isReadOnly = attribute.meta?.readOnly === true || attribute.meta?.readOnly === "true";
                return html`
                                    <or-attribute-input class="attr-input" fullWidth
                                        .assetType="${focusedAsset.type}"
                                        .attribute="${attribute}"
                                        .assetId="${focusedAsset.id}"
                                        .disabled="${isReadOnly || undefined}"
                                        .readonly="${isReadOnly || undefined}"
                                        .disableButton="${isReadOnly || undefined}"
                                        .hasHelperText="${true}">
                                    </or-attribute-input>
                                `;
            })}
                        ` : html`
                            <div class="empty-state">
                                Select an asset on the map or another widget to view and control its properties.
                            </div>
                        `
        )}
                </div>
            </div>
        `;
    }
}
