---
description: Creating a new Widget called Control Panel for Street Light Assets 
---

You are an IoT expert, working on OpenRemote framework.

## Tasks:
1. You are creating a new Widget in Insights called "Control Panel" for Street Light Assets
2. The Widget should display a Map.
3. By clicking on the Map, it will **focus** on an asset.
4. We can customize which attributes to be changeable:
 - For example: the `toggle` attribute is for togging on/off the device
 - For example: the `auto` attribute is for togging manual/auto mode for the device

# Adding widgets on Insights

The Insights dashboard is a powerful tool to visualize your data. The widget architecture is structured to support the additions of custom widgets, whereof a short tutorial is shown below.

To know more about the dashboard builder and its terminology, check the README of the `or-dashboard-builder` component. All widget code is located under `/ui/component/or-dashboard-builder/widgets/`.

---

## Creating your own Widget

All widget code is located under `/ui/component/or-dashboard-builder/widgets/`. To create a new widget, you should follow these steps:

1. **Create a new TypeScript file** and define a `WidgetManifest` to set up your widget.
2. **Register the widget** by adding a link to the manifest in the `registerWidgetTypes()` function in the `index.ts` file.
3. **Inherit from `or-widget`** (or an extended class like `or-asset-widget`).
4. **Extend `WidgetConfig`** for your custom configuration.

### Registration

Before continuing, you are required to register the widget. This will add your widget to the 'widget browser' and handle all functions automatically.

```typescript
export function registerWidgetTypes() {
    widgetTypes.set("linechart", ChartWidget.getManifest());
    widgetTypes.set("gauge", GaugeWidget.getManifest());
    // Add your widget here:
    widgetTypes.set("custom-widget", CustomWidget.getManifest());
}
```

---

## Example of a custom Widget

Below is a code example of how to create a custom widget. You can write the HTML/CSS code in the same file or reference it from elsewhere.

### 1. Define the Configuration and Manifest

```typescript
import {WidgetConfig, WidgetManifest, WidgetSettings} from "../or-dashboard-builder";
import {OrWidget} from "./or-widget";
import {customElement, html, property, TemplateResult} from "lit-element";

export interface CustomWidgetConfig extends WidgetConfig {
    attributeRefs: AttributeRef[];
    customFieldOne: string;
    customFieldTwo: number;
}

function getDefaultWidgetConfig(): CustomWidgetConfig {
    return {
        attributeRefs: [],
        customFieldOne: "default text",
        customFieldTwo: 0
    };
}
```

### 2. The Widget Class

The widget class handles the rendering of the data on the dashboard.

```typescript
@customElement("custom-widget")
export class CustomWidget extends OrWidget {
    
    // Override of widgetConfig with extended type
    protected readonly widgetConfig!: CustomWidgetConfig;

    static getManifest(): WidgetManifest {
        return {
            displayName: "Custom widget", // Name to display in widget browser
            displayIcon: "gauge",         // Icon from https://materialdesignicons.com
            minColumnWidth: 1,
            minColumnHeight: 1,
            getContentHtml(config: CustomWidgetConfig): OrWidget {
                return new CustomWidget(config);
            },
            getSettingsHtml(config: CustomWidgetConfig): WidgetSettings {
                return new CustomSettings(config);
            },
            getDefaultConfig(): CustomWidgetConfig {
                return getDefaultWidgetConfig();
            }
        }
    }

    public refreshContent(force: boolean) {
        // Implement logic to refresh data (e.g. re-fetching asset data)
    }

    protected render(): TemplateResult {
        return html`
            <div>
                <h3>${this.widgetConfig.customFieldOne}</h3>
                <p>Value: ${this.widgetConfig.customFieldTwo}</p>
            </div>
        `;
    }
}
```

### 3. The Settings Class

The settings class provides the UI for the user to configure the widget instance.

```typescript
@customElement("custom-settings")
export class CustomSettings extends WidgetSettings {
    
    // Override of widgetConfig with extended type
    protected readonly widgetConfig!: CustomWidgetConfig;

    protected render(): TemplateResult {
        return html`
            <span>Custom settings</span>
            <input 
                type="text" 
                .value="${this.widgetConfig.customFieldOne}"
                @input="${(e: any) => {
                    this.widgetConfig.customFieldOne = e.target.value;
                    this.requestUpdate();
                }}"
            >
        `;
    }
}
```

---

## Important Notes

* **Min Width/Height:** The `minColumnWidth` and `minColumnHeight` fields in the manifest define the smallest size the widget can be resized to in the dashboard grid.
* **Icons:** The `displayIcon` property uses the `<or-icon>` component which maps to Material Design Icons.
* **Asset Integration:** If your widget needs to interact with OpenRemote assets specifically, consider inheriting from `OrAssetWidget` instead of `OrWidget` to gain built-in asset selection and tracking capabilities.