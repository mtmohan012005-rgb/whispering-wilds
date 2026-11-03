Shader "WhisperingWilds/Environment/WindSwayFoliage"
{
    Properties
    {
        _MainTex ("Albedo Texture (வண்ணப் படம்)", 2D) = "white" {}
        _Color ("Tint Color (நிறச் சாயல்)", Color) = (0.2, 0.65, 0.25, 1.0)
        _Cutoff ("Alpha Cutoff", Range(0.0, 1.0)) = 0.5
        _WindStrength ("Wind Sway Strength", Range(0.0, 1.0)) = 0.35
        _WindSpeed ("Wind Gust Speed", Float) = 2.2
        _Turbulence ("Canopy Turbulence", Float) = 1.4
    }

    SubShader
    {
        Tags { "RenderType"="TransparentCutout" "Queue"="AlphaTest" "RenderPipeline"="HDRenderPipeline" }
        LOD 200
        Cull Off

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
                float4 color : COLOR;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldNormal : TEXCOORD1;
                fixed4 color : COLOR;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            float4 _Color;
            float _Cutoff;
            float _WindStrength;
            float _WindSpeed;
            float _Turbulence;

            v2f vert (appdata v)
            {
                v2f o;
                float3 worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;

                // Height-dependent displacement (stalk root stays fixed, canopy sways)
                float heightWeight = saturate(v.vertex.y);

                // Wind gust vector simulation (Cauvery delta monsoon winds)
                float gust = sin(_Time.y * _WindSpeed + worldPos.x * _Turbulence + worldPos.z * _Turbulence) * _WindStrength;
                worldPos.x += gust * heightWeight;
                worldPos.z += gust * 0.7 * heightWeight;

                o.pos = mul(UNITY_MATRIX_VP, float4(worldPos, 1.0));
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                o.color = v.color * _Color;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 tex = tex2D(_MainTex, i.uv);
                clip(tex.a - _Cutoff);
                return tex * i.color;
            }
            ENDCG
        }
    }
    FallBack "Transparent/Cutout/Diffuse"
}
