import {css, html, PropertyValues, TemplateResult} from "lit";
import {customElement, query, state} from "lit/decorators.js";
import {OrAssetWidget} from "../util/or-asset-widget";
import {OrWidget, WidgetManifest} from "../util/or-widget";
import {WidgetSettings} from "../util/widget-settings";
import {AssetWidgetConfig} from "../util/widget-config";
import {Asset} from "@openremote/model";
import {LngLatLike, Util as MapUtil, OrMap, AssetWithLocation, OrMapMarkersChangedEvent, OrMapLoadedEvent, OrMapMarkerEventDetail} from "@openremote/or-map";
import {map} from "lit/directives/map.js";
import { when } from "lit/directives/when.js";
import {StreetlightSettings} from "../settings/streetlight-settings";
import "@openremote/or-map";
import "@openremote/or-attribute-input";

export interface StreetlightWidgetConfig extends AssetWidgetConfig {
    assetType?: string
    allOfType?: boolean,
    assetIds: string[]
    attributeNames: string[]
    zoom?: number,
    center?: LngLatLike,
    showGeoJson: boolean,
}

function getDefaultConfig(): StreetlightWidgetConfig {
    return {
        attributeRefs: [],
        assetType: undefined,
        allOfType: true,
        assetIds: [],
        attributeNames: [],
        showGeoJson: true
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
        color: var(--mdc-theme-text-secondary-on-background, rgba(0,0,0,0.54));
        font-style: italic;
    }
`;

@customElement("streetlight-widget")
export class StreetlightWidget extends OrAssetWidget {

    protected widgetConfig!: StreetlightWidgetConfig;

    @state()
    protected _assetsOnScreen: AssetWithLocation[] = [];

    @state()
    protected _focusedAssetId?: string;

    @query("or-map")
    protected _map?: OrMap;

    static getManifest(): WidgetManifest {
        return {
            displayName: "Control Panel",
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
        this.addEventListener(OrMapLoadedEvent.NAME, this._onMapLoaded);
        this.addEventListener(OrMapMarkersChangedEvent.NAME, this._onMapMarkersChanged);
        return super.connectedCallback();
    }

    disconnectedCallback() {
        this.removeEventListener(OrMapLoadedEvent.NAME, this._onMapLoaded);
        this.removeEventListener(OrMapMarkersChangedEvent.NAME, this._onMapMarkersChanged);
        return super.disconnectedCallback();
    }

    refreshContent(force: boolean): void {
        this._loadAssets();
    }

    protected updated(changedProps: PropertyValues) {
        if(changedProps.has('widgetConfig') && this.widgetConfig) {
            this._loadAssets();
        }
        if(changedProps.has("loadedAssets") && this.loadedAssets) {
            // refresh map or focused state if necessary
            if (this._focusedAssetId && !this.loadedAssets.find(a => a.id === this._focusedAssetId)) {
                this._focusedAssetId = undefined;
            }
        }
        super.updated(changedProps);
    }

    protected _loadAssets() {
        if(!this.widgetConfig.assetType) {
            return;
        }

        if (this.widgetConfig.allOfType) {
            this.queryAssets({
                types: [this.widgetConfig.assetType!],
                select: {
                    attributes: [...this.widgetConfig.attributeNames, "location"]
                }
            }).then((assets) => {
                this.loadedAssets = assets;
            });
        } else if (this.widgetConfig.assetIds.length > 0) {
            this.queryAssets({
                ids: this.widgetConfig.assetIds,
                select: {
                    attributes: [...this.widgetConfig.attributeNames, "location"]
                }
            }).then((assets) => {
                this.loadedAssets = assets;
            });
        }
    }

    protected handleMarkerClick(e: CustomEvent<OrMapMarkerEventDetail>, asset: AssetWithLocation) {
        this._focusedAssetId = asset.id;
    }

    protected render(): TemplateResult {
        const focusedAsset = this._focusedAssetId ? this.loadedAssets.find(a => a.id === this._focusedAssetId) : undefined;

        // the map takes up half or flexible size, control panel takes the rest
        return html`
            <div id="widget-wrapper">
                <or-map id="miniMap" class="or-map" .zoom="${this.widgetConfig.zoom}" .center="${this.widgetConfig.center}" .showGeoJson="${this.widgetConfig.showGeoJson}" style="flex: 1; min-height: 50%;">
                    ${map(this._assetsOnScreen, (asset) => html`
                        <or-map-marker-asset 
                            .asset="${asset}" 
                            @or-map-marker-clicked="${(e: CustomEvent<OrMapMarkerEventDetail>) => this.handleMarkerClick(e, asset)}"
                        ></or-map-marker-asset>
                    `)}
                </or-map>
                <div id="control-panel-wrapper">
                    ${focusedAsset ? html`
                        <div class="panel-header">${focusedAsset.name || focusedAsset.id}</div>
                        ${this.widgetConfig.attributeNames.map(attrName => {
                            const attribute = focusedAsset.attributes ? focusedAsset.attributes[attrName] : undefined;
                            if (!attribute) return html``;
                            return html`
                                <or-attribute-input class="attr-input" fullWidth
                                    .assetType="${focusedAsset.type}"
                                    .attribute="${attribute}"
                                    .assetId="${focusedAsset.id}"
                                    .disabled="${false}"
                                    .readonly="${false}"
                                    .hasHelperText="${true}">
                                </or-attribute-input>
                            `;
                        })}
                    ` : html`
                        <div class="empty-state">
                            Select an asset on the map to view and control its properties.
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    protected _onMapLoaded = (e: OrMapLoadedEvent) => {
        const assetType = this.widgetConfig.allOfType ? undefined : this.widgetConfig.assetType;
        const assets = this.loadedAssets.filter(asset => !assetType || asset.type === assetType).filter(MapUtil.isAssetWithLocation);
        this._map?.addAssets(assets);
    }

    protected _onMapMarkersChanged = (e: OrMapMarkersChangedEvent) => {
        this._assetsOnScreen = e.detail;
    }

}
