package org.openremote.model.asset.impl;

import org.openremote.model.asset.Asset;
import org.openremote.model.asset.AssetDescriptor;
import org.openremote.model.value.AttributeDescriptor;
import org.openremote.model.value.ValueFormat;
import org.openremote.model.value.ValueType;

import jakarta.persistence.Entity;
import java.util.Date;
import java.util.Optional;

import static org.openremote.model.Constants.UNITS_VOLT;
import static org.openremote.model.Constants.UNITS_WATT;
import static org.openremote.model.Constants.UNITS_KILO;
import static org.openremote.model.Constants.UNITS_HOUR;

@Entity
public class StreetLightAsset extends Asset<ThingAsset> {

    public static final AttributeDescriptor<Boolean> TOGGLE = new AttributeDescriptor<>("toggle", ValueType.BOOLEAN)
            .withFormat(ValueFormat.BOOLEAN_ON_OFF());
    public static final AttributeDescriptor<Boolean> AUTO = new AttributeDescriptor<>("auto", ValueType.BOOLEAN)
            .withFormat(ValueFormat.BOOLEAN_ON_OFF());
    public static final AttributeDescriptor<Double> POWER = new AttributeDescriptor<>("power", ValueType.NUMBER)
            .withUnits(UNITS_WATT);
    public static final AttributeDescriptor<Double> VOLTAGE = new AttributeDescriptor<>("voltage", ValueType.NUMBER)
            .withUnits(UNITS_VOLT);
    public static final AttributeDescriptor<Double> WORKING_CURRENT = new AttributeDescriptor<>("workingCurrent",
            ValueType.NUMBER).withUnits("A");
    public static final AttributeDescriptor<Double> TOTAL_ENERGY_CONSUMPTION = new AttributeDescriptor<>(
            "totalEnergyConsumption", ValueType.NUMBER).withUnits(UNITS_KILO, UNITS_WATT, UNITS_HOUR); // kWh is
                                                                                                       // somewhat
                                                                                                       // standard
    public static final AttributeDescriptor<Date> ON_TIME = new AttributeDescriptor<>("onTime",
            ValueType.DATE_AND_TIME);
    public static final AttributeDescriptor<Date> OFF_TIME = new AttributeDescriptor<>("offTime",
            ValueType.DATE_AND_TIME);

    public static final AssetDescriptor<StreetLightAsset> DESCRIPTOR = new AssetDescriptor<>("post-lamp", "e6688a",
            StreetLightAsset.class);

    /**
     * For use by hydrators (i.e. JPA/Jackson)
     */
    protected StreetLightAsset() {
    }

    public StreetLightAsset(String name) {
        super(name);
    }

    public Optional<Double> getPower() {
        return getAttributes().getValue(POWER);
    }

    public StreetLightAsset setPower(Double value) {
        getAttributes().getOrCreate(POWER).setValue(value);
        return this;
    }

    public Optional<Double> getVoltage() {
        return getAttributes().getValue(VOLTAGE);
    }

    public StreetLightAsset setVoltage(Double value) {
        getAttributes().getOrCreate(VOLTAGE).setValue(value);
        return this;
    }

    public Optional<Double> getWorkingCurrent() {
        return getAttributes().getValue(WORKING_CURRENT);
    }

    public StreetLightAsset setWorkingCurrent(Double value) {
        getAttributes().getOrCreate(WORKING_CURRENT).setValue(value);
        return this;
    }

    public Optional<Double> getTotalEnergyConsumption() {
        return getAttributes().getValue(TOTAL_ENERGY_CONSUMPTION);
    }

    public StreetLightAsset setTotalEnergyConsumption(Double value) {
        getAttributes().getOrCreate(TOTAL_ENERGY_CONSUMPTION).setValue(value);
        return this;
    }

    public Optional<Boolean> getAuto() {
        return getAttributes().getValue(AUTO);
    }

    public StreetLightAsset setAuto(Boolean value) {
        getAttributes().getOrCreate(AUTO).setValue(value);
        return this;
    }

    public Optional<Boolean> getToggle() {
        return getAttributes().getValue(TOGGLE);
    }

    public StreetLightAsset setToggle(Boolean value) {
        getAttributes().getOrCreate(TOGGLE).setValue(value);
        return this;
    }

    public Optional<Date> getOnTime() {
        return getAttributes().getValue(ON_TIME);
    }

    public StreetLightAsset setOnTime(Date value) {
        getAttributes().getOrCreate(ON_TIME).setValue(value);
        return this;
    }

    public Optional<Date> getOffTime() {
        return getAttributes().getValue(OFF_TIME);
    }

    public StreetLightAsset setOffTime(Date value) {
        getAttributes().getOrCreate(OFF_TIME).setValue(value);
        return this;
    }
}
