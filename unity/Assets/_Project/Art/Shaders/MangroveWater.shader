Shader "WhisperingWilds/Environment/MangroveWater"
{
    Properties
    {
        _DeepWaterColor ("Deep Water Color (கருநீலம்/மண்)", Color) = (0.04, 0.12, 0.08, 0.95)
        _ShallowWaterColor ("Shallow Water Color (ஆழமற்ற நீர்)", Color) = (0.12, 0.32, 0.22, 0.75)
        _FoamColor ("Foam / Silt Color (நுரை)", Color) = (0.75, 0.78, 0.70, 0.8)
        _WaveSpeed ("Tidal Wave Speed", Float) = 0.8
        _WaveFrequency ("Wave Frequency", Float) = 1.5
        _WaveAmplitude ("Wave Height Amplitude", Float) = 0.08
        _Turbidity ("Mangrove Silt Turbidity", Range(0.0, 1.0)) = 0.65
        _Smoothness ("Water Surface Smoothness", Range(0.0, 1.0)) = 0.92
    }

    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent" "RenderPipeline"="HDRenderPipeline" }
        LOD 200
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off

        Pass
        {
            Name "ForwardOnly"
            Tags { "LightMode"="ForwardOnly" }

            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 3.0
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldNormal : TEXCOORD1;
                float3 worldPos : TEXCOORD2;
            };

            float4 _DeepWaterColor;
            float4 _ShallowWaterColor;
            float4 _FoamColor;
            float _WaveSpeed;
            float _WaveFrequency;
            float _WaveAmplitude;
            float _Turbidity;
            float _Smoothness;

            v2f vert (appdata v)
            {
                v2f o;
                float3 worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;

                // Pichavaram mangrove tidal wave simulation
                float wave = sin(worldPos.x * _WaveFrequency + _Time.y * _WaveSpeed) * 
                             cos(worldPos.z * _WaveFrequency * 0.8 + _Time.y * _WaveSpeed * 0.7);
                worldPos.y += wave * _WaveAmplitude;

                o.pos = mul(UNITY_MATRIX_VP, float4(worldPos, 1.0));
                o.uv = v.uv;
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                o.worldPos = worldPos;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                // Dynamic surface ripple normals
                float ripple = sin((i.worldPos.x + i.worldPos.z) * 4.0 + _Time.y * 2.0) * 0.1;
                float3 normal = normalize(i.worldNormal + float3(ripple, 0, ripple));

                // View angle Fresnel falloff
                float3 viewDir = normalize(_WorldSpaceCameraPos - i.worldPos);
                float fresnel = pow(1.0 - saturate(dot(viewDir, normal)), 3.0);

                // Blend between shallow silted edge and deep mangrove channel
                fixed4 waterColor = lerp(_DeepWaterColor, _ShallowWaterColor, _Turbidity);
                waterColor = lerp(waterColor, _FoamColor, fresnel * 0.4);

                return waterColor;
            }
            ENDCG
        }
    }
    FallBack "Transparent/Diffuse"
}
